import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getRepositoryForUser: vi.fn(),
  getRepositoryOperationalStatus: vi.fn(),
  getLatestChangedProviderPollRun: vi.fn(),
  persistProvenancePlan: vi.fn(),
  recordRepositoryScanRun: vi.fn(),
}));
const scanInstalledTypeScriptRepository = vi.hoisted(() => vi.fn());
const fetchTwilioOpenApi = vi.hoisted(() => vi.fn());
const diffTwilioOpenApi = vi.hoisted(() => vi.fn());
const matchChangeToRepository = vi.hoisted(() => vi.fn());
const buildProvenancePlan = vi.hoisted(() => vi.fn());

vi.mock("./db", () => dbMocks);
vi.mock("./intelligence/githubRepositoryScanner", () => ({ scanInstalledTypeScriptRepository }));
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

describe("authenticated full pipeline router", () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach(mock => mock.mockReset());
    scanInstalledTypeScriptRepository.mockReset();
    fetchTwilioOpenApi.mockReset();
    diffTwilioOpenApi.mockReset();
    matchChangeToRepository.mockReset();
    buildProvenancePlan.mockReset();
  });

  it("scans the owned repository and reconciles only installed provider packages with poll state", async () => {
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
    dbMocks.getLatestChangedProviderPollRun.mockResolvedValue(undefined);

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(scanInstalledTypeScriptRepository).toHaveBeenCalledWith({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test" });
    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 300001, status: "succeeded", dependencyCount: 2, codeEvidenceCount: 1 }));
    expect(result.monitoredProviders.map(provider => provider.provider)).toEqual(["stripe", "openai"]);
    expect(result.changedProviders).toEqual(["openai"]);
    expect(result.findingsCreated).toBe(0);
  });

  it("persists a source-backed finding only when a real changed Twilio revision produces a deterministic match", async () => {
    dbMocks.getRepositoryForUser.mockResolvedValue({ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
    const evidence = { dependencies: [{ packageName: "twilio" }], codeEvidence: [{ provider: "twilio", kind: "direct_sdk_call" }] };
    scanInstalledTypeScriptRepository.mockResolvedValue({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test", commitSha: "c".repeat(40), defaultBranch: "main", fileCount: 4, totalBytes: 500, evidence });
    dbMocks.getRepositoryOperationalStatus.mockResolvedValue({ repository: { id: 300001 }, lastScan: undefined, providerPolls: [{ provider: "twilio", lastStatus: "changed", lastSuccessAt: new Date() }] });
    dbMocks.getLatestChangedProviderPollRun.mockResolvedValue({ priorCommitSha: "a".repeat(40), nextCommitSha: "b".repeat(40) });
    fetchTwilioOpenApi.mockResolvedValueOnce({ sourceRef: "a".repeat(40) }).mockResolvedValueOnce({ sourceRef: "b".repeat(40) });
    const change = { provider: "twilio", externalId: "twilio-change" };
    diffTwilioOpenApi.mockReturnValue([change]);
    const candidate = { dedupeKey: "candidate-1", change, repository: { repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test", commitSha: "c".repeat(40), codeEvidence: evidence.codeEvidence }, confidence: 0.75, severity: "medium", scoreReasons: [] };
    matchChangeToRepository.mockReturnValue(candidate);
    buildProvenancePlan.mockReturnValue({ nodes: [], edges: [], evidencePacket: {} });
    dbMocks.persistProvenancePlan.mockResolvedValue(901);

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(fetchTwilioOpenApi).toHaveBeenCalledWith("a".repeat(40));
    expect(fetchTwilioOpenApi).toHaveBeenCalledWith("b".repeat(40));
    expect(dbMocks.persistProvenancePlan).toHaveBeenCalledWith(300001, expect.any(Object));
    expect(result.findingsCreated).toBe(1);
    expect(result.nextStep).toContain("source-backed impact finding");
  });

  it("records a bounded failed scan audit and returns a safe error when analysis fails", async () => {
    dbMocks.getRepositoryForUser.mockResolvedValue({ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
    scanInstalledTypeScriptRepository.mockRejectedValue(new Error("GitHub source unavailable"));

    await expect(appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 })).rejects.toThrow("Read-only repository analysis failed.");

    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 300001, status: "failed", commitSha: "unavailable", errorSummary: "GitHub source unavailable" }));
  });
});
