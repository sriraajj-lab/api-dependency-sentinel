import { describe, expect, it } from "vitest";

describe("GitHub App client credentials", () => {
  it("are accepted by GitHub before live installation work is enabled", async () => {
    const clientId = process.env.GITHUB_APP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;

    expect(clientId).toBeTruthy();
    expect(clientSecret).toBeTruthy();

    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: "sentinel-credential-contract-check",
      }),
    });

    const payload = (await response.json()) as { error?: string; error_description?: string };

    // The deliberately invalid code must be rejected. Depending on whether the
    // App has a callback URI configured, GitHub can reject the callback contract
    // before it evaluates the code. In either accepted response, GitHub has
    // reached App-level validation; incorrect credentials produce invalid_client.
    expect(response.ok).toBe(true);
    expect(["bad_verification_code", "redirect_uri_mismatch"]).toContain(payload.error);
    expect(payload.error).not.toBe("invalid_client");
  }, 20_000);
});
