import { describe, expect, it } from "vitest";

type GitHubUser = {
  login?: string;
};

async function verifyGitHubToken(token: string | undefined) {
  if (!token) return { ok: false, status: 0, login: undefined };

  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "api-dependency-sentinel-credential-check",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  const body = response.ok ? ((await response.json()) as GitHubUser) : undefined;
  return { ok: response.ok, status: response.status, login: body?.login };
}

describe("GitHub credential verification", () => {
  it("accepts at least one configured personal access token for the GitHub user endpoint", async () => {
    const primary = await verifyGitHubToken(process.env.GITHUB_PAT_PRIMARY);
    const secondary = primary.ok
      ? { ok: false, status: 0, login: undefined }
      : await verifyGitHubToken(process.env.GITHUB_PAT_SECONDARY);

    expect(primary.ok || secondary.ok).toBe(true);
  }, 15_000);
});
