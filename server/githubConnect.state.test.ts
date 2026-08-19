import { describe, expect, it } from "vitest";
import { githubConnectStateMatches, originFor } from "./githubConnect";
import { getGitHubAuthenticatedUser } from "./intelligence/githubRepositoryScanner";

describe("GitHub-first onboarding protections", () => {
  it("accepts only a callback state bound to the browser's HTTP-only connection cookie", () => {
    expect(githubConnectStateMatches("__Host-github_connect_state=expected-state", "expected-state")).toBe(true);
    expect(githubConnectStateMatches("__Host-github_connect_state=other-state", "expected-state")).toBe(false);
    expect(githubConnectStateMatches(undefined, "expected-state")).toBe(false);
  });

  it("uses the public proxy origin rather than the internal deployment host", () => {
    const request = {
      protocol: "http",
      get: (header: string) => ({
        host: "ed4fmy4lcw-m2vqspoisq-ue.a.run.app",
        "x-forwarded-host": "venturesig-e4ipjaps.manus.space",
        "x-forwarded-proto": "https",
      })[header.toLowerCase()] ?? undefined,
    };
    expect(originFor(request as never)).toBe("https://venturesig-e4ipjaps.manus.space");
  });

  it("retrieves the GitHub identity server-side without exposing the user token", async () => {
    const user = await getGitHubAuthenticatedUser({
      userAccessToken: "server-only-token",
      fetchImpl: async () => new Response(JSON.stringify({ id: 42, login: "octocat", name: "Octo Cat", email: "octo@example.test" }), { status: 200 }),
    });
    expect(user).toEqual({ id: 42, login: "octocat", name: "Octo Cat", email: "octo@example.test" });
  });
});
