import { describe, expect, it } from "vitest";
import type { SourceSnapshot } from "../../shared/intelligence";
import { diffStripeOpenApi } from "./stripeAdapter";

function snapshot(ref: string, document: unknown): SourceSnapshot {
  const body = JSON.stringify(document);
  return {
    provider: "stripe",
    sourceKind: "openapi",
    sourceUrl: "https://example.test/stripe-openapi.json",
    sourceRef: ref,
    retrievedAt: "2026-08-18T00:00:00.000Z",
    contentSha256: ref,
    contentType: "application/json",
    body,
  };
}

describe("Stripe OpenAPI adapter", () => {
  it("detects a request property becoming required with source-linked structured evidence", () => {
    const prior = snapshot("before", {
      paths: {
        "/v1/payment_intents": {
          post: {
            requestBody: {
              content: { "application/json": { schema: { properties: { amount: { type: "integer" }, currency: { type: "string" } }, required: ["amount"] } } },
            },
          },
        },
      },
    });
    const next = snapshot("after", {
      paths: {
        "/v1/payment_intents": {
          post: {
            requestBody: {
              content: { "application/json": { schema: { properties: { amount: { type: "integer" }, currency: { type: "string" } }, required: ["amount", "currency"] } } },
            },
          },
        },
      },
    });

    const changes = diffStripeOpenApi(prior, next);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      provider: "stripe",
      changeType: "requiredness_changed",
      breakingAssessment: "structural",
      sourceLocator: { kind: "schema_pointer", afterValue: "true" },
      subjects: [{ canonicalName: "POST /v1/payment_intents request.currency" }],
    });
  });

  it("detects a removed operation as a structural change", () => {
    const prior = snapshot("before", { paths: { "/v1/legacy": { post: {} } } });
    const next = snapshot("after", { paths: {} });

    const changes = diffStripeOpenApi(prior, next);

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      changeType: "removed",
      breakingAssessment: "structural",
      subjects: [{ canonicalName: "POST /v1/legacy" }],
    });
  });
});
