import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getProviderPollState: vi.fn(),
  recordProviderPollRun: vi.fn(),
  upsertProviderPollState: vi.fn(),
}));

vi.mock("../db", () => dbMocks);

import { pollOpenAiRevision } from "./openaiPolling";
import { pollTwilioRevision } from "./twilioPolling";

const commit = "b".repeat(40);

function response(body: string, options: { status?: number; headers?: Record<string, string> } = {}) {
  const status = options.status ?? 200;
  return new Response(status === 304 ? null : body, { status, headers: options.headers });
}

describe("OpenAI and Twilio revision polling", () => {
  beforeEach(() => {
    dbMocks.getProviderPollState.mockReset();
    dbMocks.recordProviderPollRun.mockReset().mockResolvedValue(undefined);
    dbMocks.upsertProviderPollState.mockReset().mockResolvedValue(undefined);
  });

  it("honors an OpenAI ETag cursor and records an unchanged audit run", async () => {
    const hash = "c".repeat(64);
    dbMocks.getProviderPollState.mockResolvedValue({ sourceUrl: "https://openai.test", etag: '"openai-etag"', commitSha: '"openai-etag"', contentSha256: hash });
    const fetchMock = vi.fn().mockResolvedValue(response("", { status: 304, headers: { etag: '"openai-etag"' } }));

    const result = await pollOpenAiRevision(fetchMock);

    expect(result).toMatchObject({ provider: "openai", outcome: "unchanged", changeCount: 0 });
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: expect.objectContaining({ "If-None-Match": '"openai-etag"' }) }));
    expect(dbMocks.recordProviderPollRun).toHaveBeenCalledWith(expect.objectContaining({ provider: "openai", outcome: "unchanged", contentSha256: hash }));
  });

  it("records a Twilio commit cursor without manufacturing a first-run diff", async () => {
    dbMocks.getProviderPollState.mockResolvedValue(undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(JSON.stringify({ sha: commit })))
      .mockResolvedValueOnce(response(JSON.stringify({ paths: {} }), { headers: { etag: '"twilio-etag"', "content-type": "application/json" } }));

    const result = await pollTwilioRevision(fetchMock);

    expect(result).toMatchObject({ provider: "twilio", outcome: "changed", nextCommitSha: commit, changeCount: 0 });
    expect(dbMocks.upsertProviderPollState).toHaveBeenCalledWith(expect.objectContaining({ provider: "twilio", commitSha: commit, etag: '"twilio-etag"', lastStatus: "changed" }));
  });
});
