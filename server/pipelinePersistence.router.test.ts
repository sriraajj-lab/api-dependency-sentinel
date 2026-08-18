import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  listUserRepositories: vi.fn(),
  listPipelineFindings: vi.fn(),
  persistProvenancePlan: vi.fn(),
}));

vi.mock("./db", () => ({
  listUserRepositories: dbMocks.listUserRepositories,
  listPipelineFindings: dbMocks.listPipelineFindings,
  persistProvenancePlan: dbMocks.persistProvenancePlan,
  listRepositoryFindings: vi.fn(),
}));

import { appRouter } from "./routers";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "owner-7",
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("pipeline persistence router", () => {
  beforeEach(() => {
    dbMocks.listUserRepositories.mockReset();
    dbMocks.listPipelineFindings.mockReset();
    dbMocks.persistProvenancePlan.mockReset();
  });

  it("persists only into a repository owned by the current user", async () => {
    dbMocks.listUserRepositories.mockResolvedValue([{ id: 42, owner: "acme", name: "billing", userId: 7 }]);
    dbMocks.persistProvenancePlan.mockResolvedValue(11);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.sentinel.persistPipelinePreview({ repositoryId: 42 });

    expect(result.findingId).toBe(11);
    expect(dbMocks.persistProvenancePlan).toHaveBeenCalledWith(42, expect.objectContaining({ nodes: expect.any(Array), edges: expect.any(Array) }));
  });

  it("returns only the selected user's persisted reviewer records", async () => {
    dbMocks.listUserRepositories.mockResolvedValue([{ id: 42, owner: "acme", name: "billing", userId: 7 }]);
    dbMocks.listPipelineFindings.mockResolvedValue([
      { id: 11, repositoryId: 42, evidencePacketJson: JSON.stringify({ matcherVersion: "ts-direct-v1" }), riskScore: 41 },
    ]);
    const caller = appRouter.createCaller(authenticatedContext());

    const result = await caller.sentinel.persistedPipelineWorkspace();

    expect(dbMocks.listPipelineFindings).toHaveBeenCalledWith(42);
    expect(result).toMatchObject({ mode: "connected", findings: [{ id: 11, evidencePacket: { matcherVersion: "ts-direct-v1" } }] });
  });
});
