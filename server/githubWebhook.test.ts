import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isSupportedGitHubWebhookEvent, verifyGitHubWebhookSignature } from "./githubWebhook";

describe("GitHub webhook verification", () => {
  const secret = "local-webhook-contract-secret";
  const body = Buffer.from('{"action":"created","installation":{"id":123}}', "utf8");
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

  it("accepts a valid SHA-256 signature for the untouched raw payload", () => {
    expect(verifyGitHubWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects missing, altered, or malformed signatures", () => {
    expect(verifyGitHubWebhookSignature(body, undefined, secret)).toBe(false);
    expect(verifyGitHubWebhookSignature(body, "sha256=deadbeef", secret)).toBe(false);
    expect(verifyGitHubWebhookSignature(Buffer.from("{}"), signature, secret)).toBe(false);
  });

  it("validates signatures produced with the configured production webhook secret", () => {
    const configuredSecret = process.env.GITHUB_WEBHOOK_SECRET;
    expect(configuredSecret).toBeTruthy();

    const configuredSignature = `sha256=${createHmac("sha256", configuredSecret!).update(body).digest("hex")}`;
    expect(verifyGitHubWebhookSignature(body, configuredSignature, configuredSecret)).toBe(true);
  });

  it("limits handling to the installation and repository-refresh events required by Sentinel", () => {
    expect(isSupportedGitHubWebhookEvent("installation")).toBe(true);
    expect(isSupportedGitHubWebhookEvent("installation_repositories")).toBe(true);
    expect(isSupportedGitHubWebhookEvent("push")).toBe(true);
    expect(isSupportedGitHubWebhookEvent("issues")).toBe(false);
  });
});
