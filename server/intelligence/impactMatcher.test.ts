import { describe, expect, it } from "vitest";
import type { ProviderChange } from "../../shared/intelligence";
import { extractRepositoryEvidence } from "./typescriptEvidence";
import { matchChangeToRepository } from "./impactMatcher";

const stripePaymentIntentChange: ProviderChange = {
  externalId: "stripe-payment-intent-requiredness",
  provider: "stripe",
  changeType: "requiredness_changed",
  breakingAssessment: "structural",
  title: "Currency is now required",
  summary: "Stripe marks currency as required for Payment Intent creation.",
  source: {
    sourceUrl: "https://docs.stripe.com/changelog/example",
    sourceRef: "stripe-spec-abc",
    retrievedAt: "2026-08-18T00:00:00.000Z",
    contentSha256: "source-hash",
  },
  sourceLocator: { kind: "schema_pointer", pointer: "#/paths/~1v1~1payment_intents/post" },
  subjects: [
    {
      provider: "stripe",
      kind: "http_operation",
      canonicalName: "POST /v1/payment_intents",
      selector: { method: "POST", path: "/v1/payment_intents" },
    },
  ],
};

describe("Change-to-code matcher", () => {
  it("creates a high-confidence candidate only when direct SDK evidence supports the Stripe change", () => {
    const repository = extractRepositoryEvidence({
      repositoryFullName: "acme/billing",
      commitSha: "abc123",
      defaultBranch: "main",
      files: [
        { path: "package.json", content: JSON.stringify({ dependencies: { stripe: "^17.0.0" } }) },
        {
          path: "src/create-intent.ts",
          content: 'import Stripe from "stripe";\nconst client = new Stripe("secret");\nclient.paymentIntents.create({ amount: 1000, currency: "usd" });',
        },
      ],
    });

    const candidate = matchChangeToRepository(stripePaymentIntentChange, repository);

    expect(candidate).toMatchObject({ severity: "high" });
    expect(candidate?.confidence).toBeGreaterThanOrEqual(0.8);
    expect(candidate?.repository.codeEvidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "direct_sdk_call", subjectCandidate: "stripe.paymentIntents.create" })])
    );
  });

  it("does not produce a finding for a repository with no provider dependency or code evidence", () => {
    const repository = extractRepositoryEvidence({
      repositoryFullName: "acme/unrelated",
      commitSha: "def456",
      defaultBranch: "main",
      files: [{ path: "src/index.ts", content: 'console.log("unrelated")' }],
    });

    expect(matchChangeToRepository(stripePaymentIntentChange, repository)).toBeUndefined();
  });
});
