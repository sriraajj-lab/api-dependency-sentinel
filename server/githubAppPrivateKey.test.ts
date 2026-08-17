import { createPrivateKey } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";
import { describe, expect, it } from "vitest";

describe("GitHub App private key", () => {
  it("authenticates the configured App with GitHub", async () => {
    const appId = process.env.GITHUB_APP_ID;
    const pem = process.env.GITHUB_APP_PRIVATE_KEY;

    expect(appId).toBeTruthy();
    expect(pem).toBeTruthy();

    const normalizedPem = pem!.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
    const keyObject = createPrivateKey(normalizedPem);
    const pkcs8 = keyObject.export({ format: "pem", type: "pkcs8" }).toString();
    const signingKey = await importPKCS8(pkcs8, "RS256");
    const now = Math.floor(Date.now() / 1000);

    const jwt = await new SignJWT({ iss: appId })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuedAt(now - 30)
      .setExpirationTime(now + 8 * 60)
      .sign(signingKey);

    const response = await fetch("https://api.github.com/app", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${jwt}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    const payload = (await response.json()) as { id?: number; slug?: string; message?: string };

    expect(response.ok, payload.message).toBe(true);
    expect(String(payload.id)).toBe(appId);
    expect(payload.slug).toBe("api-dependency-sentinel");
  }, 20_000);
});
