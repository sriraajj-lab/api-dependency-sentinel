import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { isSupportedGitHubWebhookEvent, verifyGitHubWebhookSignature } from "../githubWebhook";
import { createScheduledStripePollHandler } from "../scheduledStripePoll";
import { createScheduledOpenAiPollHandler } from "../scheduledOpenAiPoll";
import { createScheduledTwilioPollHandler } from "../scheduledTwilioPoll";
import { createGitHubConnectHandlers } from "../githubConnect";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.post("/api/github/webhook", express.raw({ type: "application/json", limit: "25mb" }), (req, res) => {
    const signature = req.header("x-hub-signature-256");
    const event = req.header("x-github-event");
    const deliveryId = req.header("x-github-delivery");
    const rawBody = req.body as Buffer;

    if (!Buffer.isBuffer(rawBody) || !verifyGitHubWebhookSignature(rawBody, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      return res.status(401).json({ error: "Invalid GitHub webhook signature" });
    }

    if (!event || !deliveryId) {
      return res.status(400).json({ error: "Missing GitHub webhook delivery metadata" });
    }

    if (!isSupportedGitHubWebhookEvent(event)) {
      return res.status(202).json({ accepted: true, ignored: true });
    }

    // Live scanning remains disabled until the App is installed on a test repository.
    // Do not log or persist unverified payloads; only this verified delivery metadata is surfaced.
    console.info(`[GitHub webhook] accepted ${event} delivery ${deliveryId}`);
    return res.status(202).json({ accepted: true, event });
  });
  app.post("/api/scheduled/stripe-poll", createScheduledStripePollHandler());
  app.post("/api/scheduled/openai-poll", createScheduledOpenAiPollHandler());
  app.post("/api/scheduled/twilio-poll", createScheduledTwilioPollHandler());
  const githubConnect = createGitHubConnectHandlers();
  app.get("/api/github/connect/start", githubConnect.start);
  app.get("/api/github/connect/callback", githubConnect.callback);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
