import { createHash } from "node:crypto";
import type { FindingEvidencePacket, ImpactCandidate } from "../../shared/intelligence";

export type ProvenancePlanNode = {
  id: string;
  scopeKey: string;
  nodeKind: string;
  logicalKey: string;
  revisionKey: string;
  contentSha256?: string;
  payload: Record<string, unknown>;
  sourceUrl?: string;
  observedAt: Date;
  parserVersion?: string;
};

export type ProvenancePlanEdge = {
  id: string;
  scopeKey: string;
  fromNodeId: string;
  toNodeId: string;
  relationType: string;
  derivationMethod: "adapter" | "ast" | "matcher";
  derivationVersion: string;
  confidenceBasisPoints?: number;
  evidenceLocator: Record<string, unknown>;
  analysisRunId?: string;
};

export type ProvenancePlan = {
  nodes: ProvenancePlanNode[];
  edges: ProvenancePlanEdge[];
  evidencePacket: FindingEvidencePacket;
};

function deterministicId(value: string) {
  return createHash("sha256").update(value).digest("base64url").slice(0, 26);
}

function observedAt(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function buildProvenancePlan(candidate: ImpactCandidate, scopeKey: string): ProvenancePlan {
  if (!scopeKey) throw new Error("A provenance scope key is required.");

  const change = candidate.change;
  const repository = candidate.repository;
  const analysisRunId = deterministicId(`${candidate.dedupeKey}|ts-direct-v1`);
  const sourceNodeId = deterministicId(`source|${change.source.contentSha256}`);
  const changeNodeId = deterministicId(`change|${change.externalId}`);
  const repositoryNodeId = deterministicId(`repo|${scopeKey}|${repository.repositoryFullName}|${repository.commitSha}`);
  const findingNodeId = deterministicId(`finding|${candidate.dedupeKey}`);

  const nodes: ProvenancePlanNode[] = [
    {
      id: sourceNodeId,
      scopeKey: "public",
      nodeKind: "source_snapshot",
      logicalKey: change.source.sourceUrl,
      revisionKey: change.source.contentSha256,
      contentSha256: change.source.contentSha256,
      payload: {
        provider: change.provider,
        sourceRef: change.source.sourceRef,
        locator: change.sourceLocator,
      },
      sourceUrl: change.source.sourceUrl,
      observedAt: observedAt(change.source.retrievedAt),
      parserVersion: "stripe-openapi-v1",
    },
    {
      id: changeNodeId,
      scopeKey: "public",
      nodeKind: "change_event",
      logicalKey: change.externalId,
      revisionKey: change.source.contentSha256,
      payload: {
        provider: change.provider,
        changeType: change.changeType,
        breakingAssessment: change.breakingAssessment,
        title: change.title,
        summary: change.summary,
        subjects: change.subjects,
      },
      sourceUrl: change.source.sourceUrl,
      observedAt: observedAt(change.source.retrievedAt),
      parserVersion: "stripe-openapi-v1",
    },
    {
      id: repositoryNodeId,
      scopeKey,
      nodeKind: "repository_revision",
      logicalKey: repository.repositoryFullName,
      revisionKey: repository.commitSha,
      payload: { defaultBranch: repository.defaultBranch, dependencies: repository.dependencies },
      observedAt: new Date(),
      parserVersion: "ts-direct-v1",
    },
    {
      id: findingNodeId,
      scopeKey,
      nodeKind: "impact_finding",
      logicalKey: candidate.dedupeKey,
      revisionKey: repository.commitSha,
      payload: {
        provider: change.provider,
        severity: candidate.severity,
        confidence: candidate.confidence,
        scoreReasons: candidate.scoreReasons,
      },
      observedAt: new Date(),
      parserVersion: "ts-direct-v1",
    },
  ];

  const edges: ProvenancePlanEdge[] = [
    {
      id: deterministicId(`${sourceNodeId}|${changeNodeId}|DECLARES_CHANGE`),
      scopeKey: "public",
      fromNodeId: sourceNodeId,
      toNodeId: changeNodeId,
      relationType: "DECLARES_CHANGE",
      derivationMethod: "adapter",
      derivationVersion: "stripe-openapi-v1",
      evidenceLocator: change.sourceLocator,
    },
    {
      id: deterministicId(`${changeNodeId}|${findingNodeId}|SUPPORTED_BY`),
      scopeKey,
      fromNodeId: findingNodeId,
      toNodeId: changeNodeId,
      relationType: "SUPPORTED_BY",
      derivationMethod: "matcher",
      derivationVersion: "ts-direct-v1",
      confidenceBasisPoints: Math.round(candidate.confidence * 10_000),
      evidenceLocator: { kind: "provider_change", externalId: change.externalId, sourceUrl: change.source.sourceUrl },
      analysisRunId,
    },
    {
      id: deterministicId(`${repositoryNodeId}|${findingNodeId}|SUPPORTED_BY`),
      scopeKey,
      fromNodeId: findingNodeId,
      toNodeId: repositoryNodeId,
      relationType: "SUPPORTED_BY",
      derivationMethod: "matcher",
      derivationVersion: "ts-direct-v1",
      confidenceBasisPoints: Math.round(candidate.confidence * 10_000),
      evidenceLocator: { kind: "repository_revision", commitSha: repository.commitSha },
      analysisRunId,
    },
  ];

  for (const codeEvidence of repository.codeEvidence) {
    const codeNodeId = deterministicId(
      `code|${scopeKey}|${repository.repositoryFullName}|${repository.commitSha}|${codeEvidence.path}|${codeEvidence.snippetSha256}`
    );
    nodes.push({
      id: codeNodeId,
      scopeKey,
      nodeKind: "code_location",
      logicalKey: `${repository.repositoryFullName}:${codeEvidence.path}:${codeEvidence.startLine}`,
      revisionKey: codeEvidence.snippetSha256,
      contentSha256: codeEvidence.snippetSha256,
      payload: {
        kind: codeEvidence.kind,
        provider: codeEvidence.provider,
        path: codeEvidence.path,
        startLine: codeEvidence.startLine,
        endLine: codeEvidence.endLine,
        symbol: codeEvidence.symbol,
        subjectCandidate: codeEvidence.subjectCandidate,
      },
      observedAt: new Date(),
      parserVersion: "ts-direct-v1",
    });
    edges.push({
      id: deterministicId(`${codeNodeId}|${repositoryNodeId}|CONTAINED_IN`),
      scopeKey,
      fromNodeId: repositoryNodeId,
      toNodeId: codeNodeId,
      relationType: "CONTAINS",
      derivationMethod: "ast",
      derivationVersion: "ts-direct-v1",
      evidenceLocator: {
        kind: "repository_ast",
        repositoryFullName: repository.repositoryFullName,
        commitSha: repository.commitSha,
        path: codeEvidence.path,
        startLine: codeEvidence.startLine,
        endLine: codeEvidence.endLine,
        snippetSha256: codeEvidence.snippetSha256,
      },
      analysisRunId,
    });
    edges.push({
      id: deterministicId(`${findingNodeId}|${codeNodeId}|SUPPORTED_BY`),
      scopeKey,
      fromNodeId: findingNodeId,
      toNodeId: codeNodeId,
      relationType: "SUPPORTED_BY",
      derivationMethod: "matcher",
      derivationVersion: "ts-direct-v1",
      confidenceBasisPoints: Math.round(candidate.confidence * 10_000),
      evidenceLocator: {
        kind: "repository_ast",
        repositoryFullName: repository.repositoryFullName,
        commitSha: repository.commitSha,
        path: codeEvidence.path,
        startLine: codeEvidence.startLine,
        endLine: codeEvidence.endLine,
        snippetSha256: codeEvidence.snippetSha256,
      },
      analysisRunId,
    });
  }

  return {
    nodes,
    edges,
    evidencePacket: {
      findingId: candidate.dedupeKey,
      change,
      repository,
      matcherVersion: "ts-direct-v1",
      confidence: candidate.confidence,
      severity: candidate.severity,
      scoreReasons: candidate.scoreReasons,
    },
  };
}
