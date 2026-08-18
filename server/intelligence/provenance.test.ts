import { describe, expect, it } from "vitest";
import type { ImpactCandidate } from "../../shared/intelligence";
import { buildProvenancePlan } from "./provenance";

const candidate: ImpactCandidate = {
  dedupeKey: "candidate-1",
  confidence: 0.9,
  severity: "high",
  scoreReasons: ["A direct SDK call matches the normalized provider subject."],
  change: {
    externalId: "stripe-change-1",
    provider: "stripe",
    changeType: "requiredness_changed",
    breakingAssessment: "structural",
    title: "Currency is required",
    summary: "Currency is now required for Payment Intent creation.",
    source: { sourceUrl: "https://docs.stripe.com/changelog/example", sourceRef: "spec-1", retrievedAt: "2026-08-18T00:00:00.000Z", contentSha256: "source-hash" },
    sourceLocator: { kind: "schema_pointer", pointer: "#/paths/~1v1~1payment_intents/post" },
    subjects: [{ provider: "stripe", kind: "http_operation", canonicalName: "POST /v1/payment_intents", selector: { method: "POST", path: "/v1/payment_intents" } }],
  },
  repository: {
    repositoryFullName: "acme/billing",
    commitSha: "abc123",
    defaultBranch: "main",
    dependencies: [{ packageName: "stripe", manifestPath: "package.json", resolvedVersion: "17.2.1" }],
    codeEvidence: [{ kind: "direct_sdk_call", provider: "stripe", path: "src/billing.ts", startLine: 4, endLine: 4, subjectCandidate: "stripe.paymentIntents.create", snippet: "client.paymentIntents.create({})", snippetSha256: "snippet-hash" }],
  },
};

describe("Provenance plan", () => {
  it("creates source, change, repository, code, and finding evidence linked by typed edges", () => {
    const plan = buildProvenancePlan(candidate, "user:42");

    expect(plan.nodes.map(node => node.nodeKind)).toEqual(
      expect.arrayContaining(["source_snapshot", "change_event", "repository_revision", "code_location", "impact_finding"])
    );
    expect(plan.edges.map(edge => edge.relationType)).toEqual(expect.arrayContaining(["DECLARES_CHANGE", "SUPPORTED_BY", "CONTAINS"]));
    expect(plan.evidencePacket.repository.commitSha).toBe("abc123");
    expect(plan.evidencePacket.change.source.contentSha256).toBe("source-hash");
  });
});
