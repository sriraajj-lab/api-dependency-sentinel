import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getActiveGitHubConnectSession: vi.fn(),
  getRepositoryForUser: vi.fn(),
  listPipelineFindings: vi.fn(),
  listRepositoryFindings: vi.fn(),
  listUserRepositories: vi.fn(),
  persistProvenancePlan: vi.fn(),
  recordRepositoryScanRun: vi.fn(),
  upsertConnectedRepository: vi.fn(),
}));
const scanInstalledTypeScriptRepository = vi.hoisted(() => vi.fn());

vi.mock("./db", () => dbMocks);
vi.mock("./intelligence/githubRepositoryScanner", () => ({ scanInstalledTypeScriptRepository }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return { user: { id: 7, openId: "owner-7", name: "Owner", email: null, loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

const candidate = { installationId: "154666062", githubRepositoryId: "999", owner: "sriraajj-lab", name: "eligible-repository", fullName: "sriraajj-lab/eligible-repository", defaultBranch: "main" };

describe("authenticated GitHub repository onboarding", () => {
  beforeEach(() => {
    Object.values(dbMocks).forEach(mock => mock.mockReset());
    scanInstalledTypeScriptRepository.mockReset();
  });

  it("returns only repositories stored after a verified GitHub user authorization", async () => {
    dbMocks.getActiveGitHubConnectSession.mockResolvedValue({ candidatesJson: JSON.stringify([candidate]) });

    const result = await appRouter.createCaller(context()).sentinel.githubConnectStatus();

    expect(result).toEqual({ status: "ready", candidates: [candidate] });
    expect(dbMocks.getActiveGitHubConnectSession).toHaveBeenCalledWith(7);
  });

  it("persists a selected verified candidate without trusting caller-supplied owner or installation data", async () => {
    dbMocks.getActiveGitHubConnectSession.mockResolvedValue({ candidatesJson: JSON.stringify([candidate]) });
    dbMocks.upsertConnectedRepository.mockResolvedValue(42);

    const result = await appRouter.createCaller(context()).sentinel.connectGitHubRepository({ githubRepositoryId: "999" });

    expect(result).toMatchObject({ repositoryId: 42, repository: candidate });
    expect(dbMocks.upsertConnectedRepository).toHaveBeenCalledWith({ userId: 7, githubRepositoryId: "999", owner: "sriraajj-lab", name: "eligible-repository", defaultBranch: "main", installationId: "154666062" });
  });

  it("rejects a repository identifier not present in the verified candidate set", async () => {
    dbMocks.getActiveGitHubConnectSession.mockResolvedValue({ candidatesJson: JSON.stringify([candidate]) });

    await expect(appRouter.createCaller(context()).sentinel.connectGitHubRepository({ githubRepositoryId: "untrusted" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMocks.upsertConnectedRepository).not.toHaveBeenCalled();
  });
});
