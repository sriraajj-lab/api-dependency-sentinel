import { describe, expect, it } from "vitest";
import { extractRepositoryEvidence } from "./typescriptEvidence";

describe("TypeScript repository evidence extractor", () => {
  it("captures a resolved Stripe dependency, direct SDK call, and endpoint evidence", () => {
    const evidence = extractRepositoryEvidence({
      repositoryFullName: "acme/billing-service",
      commitSha: "abc123",
      defaultBranch: "main",
      files: [
        {
          path: "package.json",
          content: JSON.stringify({ dependencies: { stripe: "^17.0.0" } }),
        },
        {
          path: "package-lock.json",
          content: JSON.stringify({ lockfileVersion: 3, packages: { "node_modules/stripe": { version: "17.2.1" } } }),
        },
        {
          path: "src/billing/createIntent.ts",
          content: [
            'import Stripe from "stripe";',
            "const client = new Stripe(process.env.STRIPE_SECRET_KEY!);",
            "export async function createIntent() {",
            '  return client.paymentIntents.create({ amount: 1000, currency: "usd" });',
            "}",
            'const endpoint = "https://api.stripe.com/v1/payment_intents";',
          ].join("\n"),
        },
      ],
    });

    expect(evidence.dependencies).toEqual([
      expect.objectContaining({ packageName: "stripe", declaredRange: "^17.0.0", resolvedVersion: "17.2.1" }),
    ]);
    expect(evidence.codeEvidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "import", provider: "stripe" }),
        expect.objectContaining({ kind: "client_construction", provider: "stripe", symbol: "client" }),
        expect.objectContaining({ kind: "direct_sdk_call", subjectCandidate: "stripe.paymentIntents.create" }),
        expect.objectContaining({ kind: "endpoint_literal", subjectCandidate: "https://api.stripe.com/v1/payment_intents" }),
      ])
    );
  });

  it("does not fabricate dependency evidence when package metadata is absent", () => {
    const evidence = extractRepositoryEvidence({
      repositoryFullName: "acme/no-manifest",
      commitSha: "def456",
      defaultBranch: "main",
      files: [{ path: "src/index.ts", content: 'console.log("hello")' }],
    });

    expect(evidence.dependencies).toEqual([]);
    expect(evidence.codeEvidence).toEqual([]);
  });
});
