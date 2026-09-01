import { describe, expect, it } from "vitest";
import { GITHUB_CONNECT_PATH, getUnauthenticatedRedirectPath } from "../client/src/lib/authRedirect";

describe("GitHub-first authentication redirect", () => {
  it("routes the live workspace to GitHub onboarding when no session exists", () => {
    expect(getUnauthenticatedRedirectPath("/workspace/live")).toBe(GITHUB_CONNECT_PATH);
  });

  it("does not redirect again while already on the GitHub onboarding page", () => {
    expect(getUnauthenticatedRedirectPath(GITHUB_CONNECT_PATH)).toBeNull();
  });
});
