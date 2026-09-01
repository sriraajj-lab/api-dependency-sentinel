import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getRepositoryForUser: vi.fn(),
  getRepositoryOperationalStatus: vi.fn(),
  getLatestChangedProviderPollRun: vi.fn(),
  listLatestProviderSourceSnapshots: vi.fn(),
  listPipelineFindings: vi.fn(),
  listUserRepositories: vi.fn(),
  persistProvenancePlan: vi.fn(),
  recordRepositoryScanRun: vi.fn(),
}));
const scanInstalledTypeScriptRepository = vi.hoisted(() => vi.fn());
const fetchStripeOpenApi = vi.hoisted(() => vi.fn());
const diffStripeOpenApi = vi.hoisted(() => vi.fn());
const diffOpenAiChangelog = vi.hoisted(() => vi.fn());
const fetchTwilioOpenApi = vi.hoisted(() => vi.fn());
const diffTwilioOpenApi = vi.hoisted(() => vi.fn());
const matchChangeToRepository = vi.hoisted(() => vi.fn());
const buildProvenancePlan = vi.hoisted(() => vi.fn());

vi.mock("./db", () => dbMocks);
vi.mock("./intelligence/githubRepositoryScanner", () => ({ scanInstalledTypeScriptRepository }));
vi.mock("./intelligence/stripeAdapter", () => ({ fetchStripeOpenApi, diffStripeOpenApi }));
vi.mock("./intelligence/openaiAdapter", () => ({ diffOpenAiChangelog }));
vi.mock("./intelligence/twilioAdapter", () => ({ fetchTwilioOpenApi, diffTwilioOpenApi }));
vi.mock("./intelligence/impactMatcher", () => ({ matchChangeToRepository }));
vi.mock("./intelligence/provenance", () => ({ buildProvenancePlan }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: { id: 21, openId: "github:21", name: "Owner", email: null, loginMethod: "github", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function retainedOpenAiSnapshot(sourceRef: string, contentSha256: string) {
  return {
    provider: "openai",
    sourceKind: "changelog",
    sourceUrl: "https://provider.example/openai",
    sourceRef,
    contentSha256,
    contentType: "text/html",
    body: "### Changelog\nJan 1 New entry",
    retrievedAt: new Date(),
  };
}

function prepareChangedProvider(provider: "stripe" | "openai" | "twilio") {
  dbMocks.getRepositoryForUser.mockResolvedValue({ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
  const evidence = { dependencies: [{ packageName: provider }], codeEvidence: [{ provider, kind: "direct_sdk_call" }] };
  scanInstalledTypeScriptRepository.mockResolvedValue({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test", commitSha: "c".repeat(40), defaultBranch: "main", fileCount: 4, totalBytes: 500, evidence });
  dbMocks.getRepositoryOperationalStatus.mockResolvedValue({ repository: { id: 300001 }, lastScan: undefined, providerPolls: [{ provider, lastStatus: "changed", lastSuccessAt: new Date() }] });
  const change = { provider, externalId: `${provider}-change` };
  const candidate = { dedupeKey: "candidate-1", change, repository: { repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test", commitSha: "c".repeat(40), codeEvidence: evidence.codeEvidence }, confidence: 0.75, severity: "medium", scoreReasons: [] };
  matchChangeToRepository.mockReturnValue(candidate);
  buildProvenancePlan.mockReturnValue({ nodes: [], edges: [], evidencePacket: {} });
  dbMocks.persistProvenancePlan.mockResolvedValue(901);
  dbMocks.getLatestChangedProviderPollRun.mockResolvedValue({ priorCommitSha: "a".repeat(40), nextCommitSha: "b".repeat(40) });
  return change;
}

describe("authenticated full pipeline router", () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach(mock => mock.mockReset());
    scanInstalledTypeScriptRepository.mockReset();
    fetchStripeOpenApi.mockReset();
    diffStripeOpenApi.mockReset();
    diffOpenAiChangelog.mockReset();
    fetchTwilioOpenApi.mockReset();
    diffTwilioOpenApi.mockReset();
    matchChangeToRepository.mockReset();
    buildProvenancePlan.mockReset();
  });

  it("scans the owned repository, reconciles installed providers, and safely reports insufficient retained OpenAI source history", async () => {
    dbMocks.getRepositoryForUser.mockResolvedValue({ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
    scanInstalledTypeScriptRepository.mockResolvedValue({
      repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test",
      commitSha: "b".repeat(40),
      defaultBranch: "main",
      fileCount: 4,
      totalBytes: 500,
      evidence: { dependencies: [{ packageName: "stripe" }, { packageName: "openai" }], codeEvidence: [{ provider: "stripe" }] },
    });
    dbMocks.getRepositoryOperationalStatus.mockResolvedValue({
      repository: { id: 300001 },
      lastScan: undefined,
      providerPolls: [
        { provider: "stripe", lastStatus: "unchanged", lastSuccessAt: new Date() },
        { provider: "openai", lastStatus: "changed", lastSuccessAt: new Date() },
        { provider: "twilio", lastStatus: "unchanged", lastSuccessAt: new Date() },
      ],
    });
    dbMocks.getLatestChangedProviderPollRun.mockImplementation(async provider => provider === "openai"
      ? { priorCommitSha: "prior-etag", nextCommitSha: "next-etag" }
      : undefined);
    dbMocks.listLatestProviderSourceSnapshots.mockResolvedValue([]);

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(scanInstalledTypeScriptRepository).toHaveBeenCalledWith({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test" });
    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 300001, status: "succeeded", dependencyCount: 2, codeEvidenceCount: 1 }));
    expect(result.monitoredProviders.map(provider => provider.provider)).toEqual(["stripe", "openai"]);
    expect(result.changedProviders).toEqual(["openai"]);
    expect(result.findingsCreated).toBe(0);
    expect(result.matchingNote).toContain("needs one more retained source revision");
  });

  it.each([
    ["stripe", fetchStripeOpenApi, diffStripeOpenApi],
    ["twilio", fetchTwilioOpenApi, diffTwilioOpenApi],
  ] as const)("persists a deterministic source-backed %s finding from immutable provider revisions", async (provider, fetchAdapter, diffAdapter) => {
    const change = prepareChangedProvider(provider);
    dbMocks.getLatestChangedProviderPollRun.mockResolvedValue({ priorCommitSha: "a".repeat(40), nextCommitSha: "b".repeat(40) });
    fetchAdapter.mockResolvedValueOnce({ sourceRef: "a".repeat(40) }).mockResolvedValueOnce({ sourceRef: "b".repeat(40) });
    diffAdapter.mockReturnValue([change]);

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(fetchAdapter).toHaveBeenCalledWith("a".repeat(40));
    expect(fetchAdapter).toHaveBeenCalledWith("b".repeat(40));
    expect(dbMocks.persistProvenancePlan).toHaveBeenCalledWith(300001, expect.any(Object));
    expect(result.findingsCreated).toBe(1);
    expect(result.nextStep).toContain("source-backed impact finding");
  });

  it("persists a deterministic source-backed OpenAI finding from retained changelog revisions", async () => {
    const change = prepareChangedProvider("openai");
    dbMocks.listLatestProviderSourceSnapshots.mockResolvedValue([
      retainedOpenAiSnapshot("next-revision", "b".repeat(64)),
      retainedOpenAiSnapshot("prior-revision", "a".repeat(64)),
    ]);
    diffOpenAiChangelog.mockReturnValue([change]);

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(dbMocks.listLatestProviderSourceSnapshots).toHaveBeenCalledWith("openai", 2);
    expect(diffOpenAiChangelog).toHaveBeenCalledWith(expect.objectContaining({ sourceRef: "prior-revision" }), expect.objectContaining({ sourceRef: "next-revision" }));
    expect(dbMocks.persistProvenancePlan).toHaveBeenCalledWith(300001, expect.any(Object));
    expect(result.findingsCreated).toBe(1);
  });

  it("uses the latest genuine changed revision even after the current poll state becomes unchanged", async () => {
    const change = prepareChangedProvider("openai");
    dbMocks.getRepositoryOperationalStatus.mockResolvedValue({
      repository: { id: 300001 },
      lastScan: undefined,
      providerPolls: [{ provider: "openai", lastStatus: "unchanged", lastSuccessAt: new Date() }],
    });
    dbMocks.listLatestProviderSourceSnapshots.mockResolvedValue([
      retainedOpenAiSnapshot("next-revision", "b".repeat(64)),
      retainedOpenAiSnapshot("prior-revision", "a".repeat(64)),
    ]);
    diffOpenAiChangelog.mockReturnValue([change]);

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(result.changedProviders).toEqual(["openai"]);
    expect(diffOpenAiChangelog).toHaveBeenCalled();
    expect(dbMocks.persistProvenancePlan).toHaveBeenCalledWith(300001, expect.any(Object));
    expect(result.findingsCreated).toBe(1);
  });

  it("returns a newly persisted finding in the reviewer workspace immediately after a full analysis run", async () => {
    const change = prepareChangedProvider("stripe");
    dbMocks.getLatestChangedProviderPollRun.mockResolvedValue({ priorCommitSha: "a".repeat(40), nextCommitSha: "b".repeat(40) });
    fetchStripeOpenApi.mockResolvedValueOnce({ sourceRef: "a".repeat(40) }).mockResolvedValueOnce({ sourceRef: "b".repeat(40) });
    diffStripeOpenApi.mockReturnValue([change]);
    const findings: Array<{ id: number; evidencePacketJson: string }> = [];
    dbMocks.persistProvenancePlan.mockImplementation(async () => {
      findings.push({ id: 901, evidencePacketJson: JSON.stringify({ findingId: "stripe-change", provider: "stripe" }) });
      return 901;
    });
    dbMocks.listUserRepositories.mockResolvedValue([{ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" }]);
    dbMocks.listPipelineFindings.mockImplementation(async () => findings);

    await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });
    const workspace = await appRouter.createCaller(context()).sentinel.persistedPipelineWorkspace();

    expect(dbMocks.listPipelineFindings).toHaveBeenCalledWith(300001);
    expect(workspace).toMatchObject({ mode: "connected", findings: [{ id: 901, evidencePacket: { findingId: "stripe-change", provider: "stripe" } }] });
  });

  it("records a bounded failed scan audit and returns a safe error when analysis fails", async () => {
    dbMocks.getRepositoryForUser.mockResolvedValue({ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
    scanInstalledTypeScriptRepository.mockRejectedValue(new Error("GitHub source unavailable"));

    await expect(appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 })).rejects.toThrow("Read-only repository analysis failed.");

    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 300001, status: "failed", commitSha: "unavailable", errorSummary: "GitHub source unavailable" }));
  });
});
