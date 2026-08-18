import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { createGitHubConnectSession, getGitHubConnectSession, saveGitHubConnectCandidates } from "./db";
import { exchangeGitHubUserCode, listGitHubConnectCandidates } from "./intelligence/githubRepositoryScanner";
import { sdk } from "./_core/sdk";

const SESSION_TTL_MS = 10 * 60 * 1000;

function originFor(req: Request) {
  return `${req.protocol}://${req.get("host")}`;
}

function callbackUrl(req: Request) {
  return `${originFor(req)}/api/github/connect/callback`;
}

export function createGitHubConnectHandlers() {
  return {
    start: async (req: Request, res: Response) => {
      try {
        const user = await sdk.authenticateRequest(req);
        if (user.isCron) return res.status(403).json({ error: "interactive-user-only" });
        const clientId = process.env.GITHUB_APP_CLIENT_ID;
        if (!clientId) throw new Error("GitHub App client ID is not configured.");
        const state = randomUUID();
        await createGitHubConnectSession({ state, userId: user.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
        const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
        authorizeUrl.searchParams.set("client_id", clientId);
        authorizeUrl.searchParams.set("redirect_uri", callbackUrl(req));
        authorizeUrl.searchParams.set("state", state);
        res.redirect(authorizeUrl.toString());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start GitHub connection.";
        res.status(500).json({ error: message });
      }
    },
    callback: async (req: Request, res: Response) => {
      try {
        const code = typeof req.query.code === "string" ? req.query.code : "";
        const state = typeof req.query.state === "string" ? req.query.state : "";
        if (!code || !state) return res.status(400).json({ error: "GitHub authorization code and state are required." });
        const session = await getGitHubConnectSession(state);
        if (!session || session.expiresAt <= new Date()) return res.status(400).json({ error: "GitHub connection session is missing or expired." });
        const userAccessToken = await exchangeGitHubUserCode({ code, redirectUri: callbackUrl(req) });
        const candidates = await listGitHubConnectCandidates({ userAccessToken });
        await saveGitHubConnectCandidates({ state, candidatesJson: JSON.stringify(candidates) });
        res.redirect(`${originFor(req)}/connect/github?authorized=1`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to verify GitHub repository access.";
        res.status(500).json({ error: message });
      }
    },
  };
}
