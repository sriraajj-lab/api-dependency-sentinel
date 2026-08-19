import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";

const dbMocks = vi.hoisted(() => ({
  getProviderPollState: vi.fn(),
  listLatestProviderSourceSnapshots: vi.fn(),
  recordProviderPollRun: vi.fn(),
  saveProviderSourceSnapshot: vi.fn(),
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
    dbMocks.listLatestProviderSourceSnapshots.mockReset().mockResolvedValue([{}]);
    dbMocks.recordProviderPollRun.mockReset().mockResolvedValue(undefined);
    dbMocks.saveProviderSourceSnapshot.mockReset().mockResolvedValue(undefined);
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

  it("retains one real changelog baseline when a pre-existing cursor has no stored source body", async () => {
    const rawBody = "<h1>Changelog</h1><p>Jan 1 New model update</p>";
    const hash = createHash("sha256").update(rawBody).digest("hex");
    dbMocks.getProviderPollState.mockResolvedValue({ sourceUrl: "https://openai.test", etag: '"openai-etag"', commitSha: '"openai-etag"', contentSha256: hash });
    dbMocks.listLatestProviderSourceSnapshots.mockResolvedValue([]);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response("", { status: 304, headers: { etag: '"openai-etag"' } }))
      .mockResolvedValueOnce(response(rawBody, { headers: { etag: '"openai-etag"', "content-type": "text/html" } }));

    const result = await pollOpenAiRevision(fetchMock);

    expect(result).toMatchObject({ provider: "openai", outcome: "unchanged", changeCount: 0 });
    expect(dbMocks.saveProviderSourceSnapshot).toHaveBeenCalledWith(expect.objectContaining({ provider: "openai", contentSha256: hash, body: expect.stringContaining("Changelog") }));
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
