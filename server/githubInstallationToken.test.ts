import { createPrivateKey } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";
import { describe, expect, it } from "vitest";

type GitHubInstallation = {
  id: number;
};

type GitHubRepository = {
  full_name: string;
};

async function githubJson<T>(url: string, token: string, method = "GET"): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "api-dependency-sentinel-installation-check",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!response.ok) {
    const errorBody = (await response.text()).slice(0, 300);
    throw new Error(`GitHub request failed with HTTP ${response.status}: ${errorBody}`);
  }

  return (await response.json()) as T;
}

async function createAppJwt(appId: string, rawPem: string): Promise<string> {
  const normalizedPem = rawPem.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  const keyObject = createPrivateKey(normalizedPem);
  const pkcs8 = keyObject.export({ format: "pem", type: "pkcs8" }).toString();
  const signingKey = await importPKCS8(pkcs8, "RS256");
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({ iss: appId })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now - 30)
    .setExpirationTime(now + 8 * 60)
    .sign(signingKey);
}

describe("GitHub App test installation", () => {
  it("issues an installation token that can read the isolated Sentinel fixture repository", async () => {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    expect(appId).toBeTruthy();
    expect(privateKey).toBeTruthy();

    const appJwt = await createAppJwt(appId!, privateKey!);
    const installations = await githubJson<GitHubInstallation[]>(
      "https://api.github.com/app/installations",
      appJwt
    );

    let foundFixture = false;
    for (const installation of installations) {
      const tokenPayload = await githubJson<{ token: string }>(
        `https://api.github.com/app/installations/${installation.id}/access_tokens`,
        appJwt,
        "POST"
      );
      const repositories = await githubJson<{ repositories: GitHubRepository[] }>(
        "https://api.github.com/installation/repositories",
        tokenPayload.token
      );

      if (repositories.repositories.some((repository) => repository.full_name === "sriraajj-lab/api-dependency-sentinel-test")) {
        foundFixture = true;
        expect(repositories.repositories).toHaveLength(1);
        break;
      }
    }

    expect(foundFixture).toBe(true);
  }, 30_000);
});
