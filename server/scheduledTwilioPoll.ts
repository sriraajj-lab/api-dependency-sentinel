import type { Request, Response } from "express";
import { getProviderPollStateByTaskUid } from "./db";
import { pollTwilioRevision } from "./intelligence/twilioPolling";
import { sdk } from "./_core/sdk";

export function createScheduledTwilioPollHandler(overrides: Partial<{ authenticateRequest: typeof sdk.authenticateRequest; getStateByTaskUid: typeof getProviderPollStateByTaskUid; pollTwilio: typeof pollTwilioRevision }> = {}) {
  const dependencies = { authenticateRequest: sdk.authenticateRequest.bind(sdk), getStateByTaskUid: getProviderPollStateByTaskUid, pollTwilio: pollTwilioRevision, ...overrides };
  return async (req: Request, res: Response) => {
    try {
      const user = await dependencies.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const state = await dependencies.getStateByTaskUid(user.taskUid);
      if (!state || state.provider !== "twilio") return res.json({ ok: true, skipped: "orphan" });
      const result = await dependencies.pollTwilio();
      return res.json({ ok: true, provider: "twilio", outcome: result.outcome, changeCount: result.changeCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Twilio scheduled poll failure";
      return res.status(500).json({ error: message, context: { url: req.originalUrl, taskUid: "scheduled-twilio-poll" }, timestamp: new Date().toISOString() });
    }
  };
}
