import type { Request, Response } from "express";
import { getProviderPollStateByTaskUid } from "./db";
import { pollOpenAiRevision } from "./intelligence/openaiPolling";
import { sdk } from "./_core/sdk";

export function createScheduledOpenAiPollHandler(overrides: Partial<{ authenticateRequest: typeof sdk.authenticateRequest; getStateByTaskUid: typeof getProviderPollStateByTaskUid; pollOpenAi: typeof pollOpenAiRevision }> = {}) {
  const dependencies = { authenticateRequest: sdk.authenticateRequest.bind(sdk), getStateByTaskUid: getProviderPollStateByTaskUid, pollOpenAi: pollOpenAiRevision, ...overrides };
  return async (req: Request, res: Response) => {
    try {
      const user = await dependencies.authenticateRequest(req);
      if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
      const state = await dependencies.getStateByTaskUid(user.taskUid);
      if (!state || state.provider !== "openai") return res.json({ ok: true, skipped: "orphan" });
      const result = await dependencies.pollOpenAi();
      return res.json({ ok: true, provider: "openai", outcome: result.outcome, changeCount: result.changeCount });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown OpenAI scheduled poll failure";
      return res.status(500).json({ error: message, context: { url: req.originalUrl, taskUid: "scheduled-openai-poll" }, timestamp: new Date().toISOString() });
    }
  };
}
