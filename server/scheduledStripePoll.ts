import type { Request, Response } from "express";
import { getProviderPollStateByTaskUid } from "./db";
import { pollStripeRevision } from "./intelligence/stripePolling";
import { sdk } from "./_core/sdk";

type Dependencies = {
  authenticateRequest: typeof sdk.authenticateRequest;
  getStateByTaskUid: typeof getProviderPollStateByTaskUid;
  pollStripe: typeof pollStripeRevision;
};

const defaultDependencies: Dependencies = {
  authenticateRequest: sdk.authenticateRequest.bind(sdk),
  getStateByTaskUid: getProviderPollStateByTaskUid,
  pollStripe: pollStripeRevision,
};

export function createScheduledStripePollHandler(overrides: Partial<Dependencies> = {}) {
  const dependencies = { ...defaultDependencies, ...overrides };
  return async (req: Request, res: Response) => {
    try {
      const user = await dependencies.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) {
        return res.status(403).json({ error: "cron-only" });
      }
      const state = await dependencies.getStateByTaskUid(user.taskUid);
      if (!state || state.provider !== "stripe") {
        return res.json({ ok: true, skipped: "orphan" });
      }
      const result = await dependencies.pollStripe();
      return res.json({ ok: true, provider: "stripe", outcome: result.outcome, changeCount: result.changeCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Stripe scheduled poll failure";
      return res.status(500).json({
        error: message,
        context: { url: req.originalUrl, taskUid: "scheduled-stripe-poll" },
        timestamp: new Date().toISOString(),
      });
    }
  };
}
