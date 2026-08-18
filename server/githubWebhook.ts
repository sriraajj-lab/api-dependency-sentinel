import { createHmac, timingSafeEqual } from "node:crypto";

export const supportedGitHubWebhookEvents = ["installation", "installation_repositories", "push"] as const;

export function verifyGitHubWebhookSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string | undefined
) {
  if (!secret || !signature?.startsWith("sha256=")) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== signatureBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function isSupportedGitHubWebhookEvent(event: string | undefined) {
  return supportedGitHubWebhookEvents.includes(event as (typeof supportedGitHubWebhookEvents)[number]);
}
