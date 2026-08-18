import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getProviderPollState: vi.fn(),
  recordProviderPollRun: vi.fn(),
  upsertProviderPollState: vi.fn(),
}));

vi.mock("../db", () => dbMocks);

import { pollStripeRevision } from "./stripePolling";

const commit = "a".repeat(40);

function response(body: string, options: { status?: number; headers?: Record<string, string> } = {}) {
  const status = options.status ?? 200;
  return new Response(status === 304 ? null : body, { status, headers: options.headers });
}

describe("Stripe revision polling", () => {
  beforeEach(() => {
    dbMocks.getProviderPollState.mockReset();
    dbMocks.recordProviderPollRun.mockReset().mockResolvedValue(undefined);
    dbMocks.upsertProviderPollState.mockReset().mockResolvedValue(undefined);
  });

  it("records an initial ETag and commit cursor without manufacturing a diff", async () => {
    dbMocks.getProviderPollState.mockResolvedValue(undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(JSON.stringify({ sha: commit })))
      .mockResolvedValueOnce(response(JSON.stringify({ paths: {} }), { headers: { etag: '"stripe-etag-1"', "content-type": "application/json" } }));

    const result = await pollStripeRevision(fetchMock);

    expect(result).toMatchObject({ outcome: "changed", nextCommitSha: commit, changeCount: 0 });
    expect(fetchMock.mock.calls[1][1]?.headers).not.toHaveProperty("If-None-Match");
    expect(dbMocks.upsertProviderPollState).toHaveBeenCalledWith(expect.objectContaining({ etag: '"stripe-etag-1"', commitSha: commit, lastStatus: "changed" }));
  });

  it("recognizes a 304 response and preserves the prior verified content cursor", async () => {
    dbMocks.getProviderPollState.mockResolvedValue({ sourceUrl: "https://stripe.test", etag: '"stripe-etag-1"', commitSha: commit, contentSha256: "b".repeat(64) });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(JSON.stringify({ sha: commit })))
      .mockResolvedValueOnce(response("", { status: 304, headers: { etag: '"stripe-etag-1"' } }));

    const result = await pollStripeRevision(fetchMock);

    expect(result).toMatchObject({ outcome: "unchanged", nextCommitSha: commit, changeCount: 0 });
    expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ "If-None-Match": '"stripe-etag-1"' });
    expect(dbMocks.upsertProviderPollState).toHaveBeenCalledWith(expect.objectContaining({ contentSha256: "b".repeat(64), lastStatus: "unchanged" }));
  });
});
