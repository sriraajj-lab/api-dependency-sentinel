import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getRepositoryForUser: vi.fn(),
  getRepositoryOperationalStatus: vi.fn(),
  recordRepositoryScanRun: vi.fn(),
}));
const scanInstalledTypeScriptRepository = vi.hoisted(() => vi.fn());

vi.mock("./db", () => dbMocks);
vi.mock("./intelligence/githubRepositoryScanner", () => ({ scanInstalledTypeScriptRepository }));

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

    const result = await appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 });

    expect(scanInstalledTypeScriptRepository).toHaveBeenCalledWith({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test" });
    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 300001, status: "succeeded", dependencyCount: 2, codeEvidenceCount: 1 }));
    expect(result.monitoredProviders.map(provider => provider.provider)).toEqual(["stripe", "openai"]);
    expect(result.changedProviders).toEqual(["openai"]);
    expect(result.findingsCreated).toBe(0);
  });

  it("records a bounded failed scan audit and returns a safe error when analysis fails", async () => {
    dbMocks.getRepositoryForUser.mockResolvedValue({ id: 300001, userId: 21, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
    scanInstalledTypeScriptRepository.mockRejectedValue(new Error("GitHub source unavailable"));

    await expect(appRouter.createCaller(context()).sentinel.runAuthenticatedPipeline({ repositoryId: 300001 })).rejects.toThrow("Read-only repository analysis failed.");

    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 300001, status: "failed", commitSha: "unavailable", errorSummary: "GitHub source unavailable" }));
  });
});
