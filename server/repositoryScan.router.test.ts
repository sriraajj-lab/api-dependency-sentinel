import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getRepositoryForUser: vi.fn(),
  listUserRepositories: vi.fn(),
  listPipelineFindings: vi.fn(),
  listRepositoryFindings: vi.fn(),
  persistProvenancePlan: vi.fn(),
  recordRepositoryScanRun: vi.fn(),
}));
const scanInstalledTypeScriptRepository = vi.hoisted(() => vi.fn());

vi.mock("./db", () => dbMocks);
vi.mock("./intelligence/githubRepositoryScanner", () => ({ scanInstalledTypeScriptRepository }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: { id: 7, openId: "owner-7", name: "Owner", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

describe("installed repository scan router", () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach(mock => mock.mockReset());
    scanInstalledTypeScriptRepository.mockReset();
  });

  it("uses the current user's selected repository and records only bounded scan metadata", async () => {
    dbMocks.getRepositoryForUser.mockResolvedValue({ id: 42, userId: 7, owner: "sriraajj-lab", name: "api-dependency-sentinel-test" });
    scanInstalledTypeScriptRepository.mockResolvedValue({
      repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test",
      commitSha: "a".repeat(40),
      defaultBranch: "main",
      fileCount: 5,
      totalBytes: 1234,
      evidence: { dependencies: [{ packageName: "stripe" }], codeEvidence: [{ provider: "stripe" }] },
    });
    dbMocks.recordRepositoryScanRun.mockResolvedValue(undefined);

    const result = await appRouter.createCaller(context()).sentinel.scanInstalledRepository({ repositoryId: 42 });

    expect(scanInstalledTypeScriptRepository).toHaveBeenCalledWith({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test" });
    expect(dbMocks.recordRepositoryScanRun).toHaveBeenCalledWith(expect.objectContaining({ repositoryId: 42, status: "succeeded", dependencyCount: 1, codeEvidenceCount: 1 }));
    expect(result.commitSha).toHaveLength(40);
  });
});
