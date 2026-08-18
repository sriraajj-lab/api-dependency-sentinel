import type { SourceSnapshot } from "../../shared/intelligence";
import { calculateRiskScore, riskBand } from "../../shared/risk";
import { matchChangeToRepository } from "./impactMatcher";
import { buildProvenancePlan } from "./provenance";
import { diffStripeOpenApi } from "./stripeAdapter";
import { extractRepositoryEvidence } from "./typescriptEvidence";

function snapshot(ref: string, document: unknown): SourceSnapshot {
  const body = JSON.stringify(document);
  return {
    provider: "stripe",
    sourceKind: "openapi",
    sourceUrl: "https://github.com/stripe/openapi/blob/master/openapi/spec3.json",
    sourceRef: ref,
    retrievedAt: "2026-08-18T00:00:00.000Z",
    contentSha256: `fixture-${ref}`,
    contentType: "application/json",
    body,
  };
}

export function buildPipelinePreviewArtifact() {
  const prior = snapshot("fixture-before", {
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
  const next = snapshot("fixture-after", {
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
  const change = diffStripeOpenApi(prior, next)[0];
  if (!change) throw new Error("Pipeline preview fixture did not produce a Stripe change.");

  const repository = extractRepositoryEvidence({
    repositoryFullName: "sentinel-fixtures/stripe-typescript-service",
    commitSha: "fixture-commit-2a1b3c4",
    defaultBranch: "main",
    files: [
      { path: "package.json", content: JSON.stringify({ dependencies: { stripe: "^17.0.0" } }) },
      { path: "package-lock.json", content: JSON.stringify({ lockfileVersion: 3, packages: { "node_modules/stripe": { version: "17.2.1" } } }) },
      {
        path: "src/billing/create-payment-intent.ts",
        content: [
          'import Stripe from "stripe";',
          "const client = new Stripe(process.env.STRIPE_SECRET_KEY!);",
          "export async function createPaymentIntent() {",
          '  return client.paymentIntents.create({ amount: 1000, currency: "usd" });',
          "}",
        ].join("\n"),
      },
    ],
  });
  const candidate = matchChangeToRepository(change, repository);
  if (!candidate) throw new Error("Pipeline preview fixture did not produce an impact candidate.");
  const plan = buildProvenancePlan(candidate, "fixture");
  const riskScore = calculateRiskScore({
    severity: candidate.severity,
    codeReferenceConfidence: candidate.confidence,
    executionSurface: candidate.repository.codeEvidence.length,
  });

  const finding = {
    id: candidate.dedupeKey,
    provider: "Stripe",
    providerColor: "#635bff",
    type: "Schema change" as const,
    title: change.title,
    summary: change.summary,
    sourceUrl: change.source.sourceUrl,
    sourceLabel: "Stripe OpenAPI structured diff",
    sourcePointer: change.sourceLocator.pointer ?? "Unavailable",
    codePaths: candidate.repository.codeEvidence.map(evidence => `${evidence.path}:${evidence.startLine}`),
    owner: "Unassigned",
    due: "No published deadline",
    daysUntilDeadline: 90,
    confidence: candidate.confidence,
    severity: candidate.severity,
    status: "needs_review" as const,
    riskScore,
    evidence: {
      commitSha: repository.commitSha,
      matcherVersion: plan.evidencePacket.matcherVersion,
      scoreReasons: candidate.scoreReasons,
      sourceHash: change.source.contentSha256,
      provenanceNodeCount: plan.nodes.length,
      provenanceEdgeCount: plan.edges.length,
    },
  };

  return {
    candidate,
    plan,
    riskMap: {
    workspace: {
      repository: repository.repositoryFullName,
      branch: repository.defaultBranch,
      scannedAt: "Pipeline fixture · structured diff + AST evidence",
      mode: "pipeline_fixture" as const,
    },
    summary: {
      monitoredProviders: 1,
      activeFindings: 1,
      highestRisk: riskScore,
      confidence: Math.round(candidate.confidence * 100),
      band: riskBand(riskScore),
    },
    findings: [finding],
    },
  };
}

export function buildPipelinePreviewRiskMap() {
  return buildPipelinePreviewArtifact().riskMap;
}
