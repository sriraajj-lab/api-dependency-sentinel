import { describe, expect, it } from "vitest";
import type { SourceSnapshot } from "../../shared/intelligence";
import { diffStripeOpenApi, fetchStripeOpenApiConditional } from "./stripeAdapter";

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
  it("fetches the canonical commit-pinned OpenAPI file used by scheduled polling", async () => {
    const commitSha = "a".repeat(40);
    const requestedUrls: string[] = [];
    const fetchImpl = async (input: string | URL | Request) => {
      const url = String(input);
      requestedUrls.push(url);
      if (url.includes("/commits/master")) {
        return new Response(JSON.stringify({ sha: commitSha }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ paths: {} }), {
        status: 200,
        headers: { "content-type": "application/json", etag: "stripe-etag" },
      });
    };

    const result = await fetchStripeOpenApiConditional({}, fetchImpl);

    expect(result).toMatchObject({
      status: "changed",
      cursor: { commitSha, etag: "stripe-etag" },
    });
    expect(requestedUrls).toEqual([
      "https://api.github.com/repos/stripe/openapi/commits/master",
      `https://raw.githubusercontent.com/stripe/openapi/${commitSha}/openapi/spec3.json`,
    ]);
  });

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
