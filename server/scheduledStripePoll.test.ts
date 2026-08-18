import { describe, expect, it, vi } from "vitest";
import { createScheduledStripePollHandler } from "./scheduledStripePoll";

function responseRecorder() {
  const state: { code?: number; body?: unknown } = {};
  const res = {
    status: vi.fn((code: number) => { state.code = code; return res; }),
    json: vi.fn((body: unknown) => { state.body = body; return res; }),
  };
  return { res, state };
}

describe("scheduled Stripe poll callback", () => {
  it("skips an orphaned cron task without polling", async () => {
    const { res, state } = responseRecorder();
    const pollStripe = vi.fn();
    const handler = createScheduledStripePollHandler({
      authenticateRequest: vi.fn().mockResolvedValue({ isCron: true, taskUid: "task-missing" }) as never,
      getStateByTaskUid: vi.fn().mockResolvedValue(undefined),
      pollStripe: pollStripe as never,
    });

    await handler({ originalUrl: "/api/scheduled/stripe-poll" } as never, res as never);

    expect(state).toMatchObject({ body: { ok: true, skipped: "orphan" } });
    expect(pollStripe).not.toHaveBeenCalled();
  });

  it("runs only an authenticated Stripe cron and reports its bounded outcome", async () => {
    const { res, state } = responseRecorder();
    const handler = createScheduledStripePollHandler({
      authenticateRequest: vi.fn().mockResolvedValue({ isCron: true, taskUid: "task-stripe" }) as never,
      getStateByTaskUid: vi.fn().mockResolvedValue({ provider: "stripe" }),
      pollStripe: vi.fn().mockResolvedValue({ outcome: "unchanged", changeCount: 0 }) as never,
    });

    await handler({ originalUrl: "/api/scheduled/stripe-poll" } as never, res as never);

    expect(state).toMatchObject({ body: { ok: true, provider: "stripe", outcome: "unchanged", changeCount: 0 } });
  });
});
