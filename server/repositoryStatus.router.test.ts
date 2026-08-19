import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const getRepositoryOperationalStatus = vi.hoisted(() => vi.fn());

vi.mock("./db", () => ({ getRepositoryOperationalStatus }));

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: { id: 17, openId: "github:17", name: "Owner", email: null, loginMethod: "github", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("repository operational status router", () => {
  beforeEach(() => getRepositoryOperationalStatus.mockReset());

  it("returns compact status only for the current authenticated owner", async () => {
    const status = {
      repository: { id: 300001, owner: "sriraajj-lab", name: "api-dependency-sentinel-test", connectionStatus: "connected" },
      lastScan: { status: "succeeded", fileCount: 4, scannedAt: new Date("2026-08-19T12:00:00Z") },
      providerPolls: [{ provider: "stripe", lastStatus: "unchanged", lastSuccessAt: new Date("2026-08-19T12:00:00Z") }],
    };
    getRepositoryOperationalStatus.mockResolvedValue(status);

    const result = await appRouter.createCaller(context()).sentinel.repositoryStatus();

    expect(getRepositoryOperationalStatus).toHaveBeenCalledWith(17);
    expect(result).toEqual(status);
  });
});
