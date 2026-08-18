import { describe, expect, it, vi } from "vitest";
import { createScheduledOpenAiPollHandler } from "./scheduledOpenAiPoll";
import { createScheduledTwilioPollHandler } from "./scheduledTwilioPoll";

function responseRecorder() {
  const state: { code?: number; body?: unknown } = {};
  const res = {
    status: vi.fn((code: number) => { state.code = code; return res; }),
    json: vi.fn((body: unknown) => { state.body = body; return res; }),
  };
  return { res, state };
}

describe("scheduled OpenAI and Twilio callbacks", () => {
  it("runs only the provider whose durable state matches the authenticated OpenAI task", async () => {
    const { res, state } = responseRecorder();
    const handler = createScheduledOpenAiPollHandler({
      authenticateRequest: vi.fn().mockResolvedValue({ isCron: true, taskUid: "task-openai" }) as never,
      getStateByTaskUid: vi.fn().mockResolvedValue({ provider: "openai" }),
      pollOpenAi: vi.fn().mockResolvedValue({ outcome: "unchanged", changeCount: 0 }) as never,
    });

    await handler({ originalUrl: "/api/scheduled/openai-poll" } as never, res as never);

    expect(state).toMatchObject({ body: { ok: true, provider: "openai", outcome: "unchanged", changeCount: 0 } });
  });

  it("skips an orphaned Twilio task without polling an unrelated provider", async () => {
    const { res, state } = responseRecorder();
    const pollTwilio = vi.fn();
    const handler = createScheduledTwilioPollHandler({
      authenticateRequest: vi.fn().mockResolvedValue({ isCron: true, taskUid: "task-missing" }) as never,
      getStateByTaskUid: vi.fn().mockResolvedValue(undefined),
      pollTwilio: pollTwilio as never,
    });

    await handler({ originalUrl: "/api/scheduled/twilio-poll" } as never, res as never);

    expect(state).toMatchObject({ body: { ok: true, skipped: "orphan" } });
    expect(pollTwilio).not.toHaveBeenCalled();
  });
});
