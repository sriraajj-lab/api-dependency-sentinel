import { describe, expect, it } from "vitest";
import { normalizeOpenAiChangelog } from "./openaiAdapter";
import { diffTwilioOpenApi } from "./twilioAdapter";

describe("normalized OpenAI and Twilio adapters", () => {
  it("normalizes an OpenAI deprecation with a model-bearing source excerpt", () => {
    const changes = normalizeOpenAiChangelog({
      provider: "openai", sourceKind: "changelog", sourceUrl: "https://developers.openai.com/api/docs/changelog", sourceRef: "fixture", retrievedAt: "2026-08-18T00:00:00.000Z", contentSha256: "a".repeat(64), contentType: "text/html",
      body: "### August, 2026\nAug 18 Deprecation: gpt-4.1-mini will be removed from /v1/responses on September 1.\nMigrate to gpt-5-mini.",
    });
    expect(changes[0]).toMatchObject({ provider: "openai", changeType: "deprecated", breakingAssessment: "provider_declared" });
    expect(changes[0].subjects).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "model_identifier", canonicalName: "gpt-4.1-mini" })]));
  });

  it("identifies a removed Twilio operation as structural evidence", () => {
    const prior = { provider: "twilio" as const, sourceKind: "openapi" as const, sourceUrl: "https://twilio.test/next", sourceRef: "before", retrievedAt: "2026-08-18T00:00:00.000Z", contentSha256: "b".repeat(64), contentType: "application/json", body: JSON.stringify({ paths: { "/2010-04-01/Accounts/{AccountSid}/Messages.json": { post: { operationId: "CreateMessage" } } } }) };
    const next = { ...prior, sourceRef: "after", contentSha256: "c".repeat(64), body: JSON.stringify({ paths: {} }) };
    const changes = diffTwilioOpenApi(prior, next);
    expect(changes[0]).toMatchObject({ provider: "twilio", changeType: "removed", breakingAssessment: "structural" });
    expect(changes[0].subjects[0]).toMatchObject({ kind: "http_operation", selector: expect.objectContaining({ method: "POST" }) });
  });
});
