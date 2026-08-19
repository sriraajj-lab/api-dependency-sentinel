import { and, desc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { githubConnectSessions, InsertUser, pipelineFindings, providerPollRuns, providerPollStates, provenanceEdges, provenanceNodes, repositories, repositoryScanRuns, riskFindings, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { ProvenancePlan } from "./intelligence/provenance";
import { calculateRiskScore } from "../shared/risk";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function listUserRepositories(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(repositories).where(eq(repositories.userId, userId)).orderBy(desc(repositories.updatedAt));
}

export async function createGitHubConnectSession(input: { state: string; expiresAt: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for GitHub connection onboarding.");
  await db.insert(githubConnectSessions).values({ state: input.state, expiresAt: input.expiresAt });
}

export async function getGitHubConnectSession(state: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(githubConnectSessions).where(eq(githubConnectSessions.state, state)).limit(1);
  return result[0];
}

export async function saveGitHubConnectCandidates(input: { state: string; userId: number; candidatesJson: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for GitHub connection onboarding.");
  await db.update(githubConnectSessions).set({ userId: input.userId, candidatesJson: input.candidatesJson }).where(eq(githubConnectSessions.state, input.state));
}

export async function getActiveGitHubConnectSession(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(githubConnectSessions)
    .where(and(eq(githubConnectSessions.userId, userId), gt(githubConnectSessions.expiresAt, new Date())))
    .orderBy(desc(githubConnectSessions.updatedAt)).limit(1);
  return result[0];
}

export async function upsertConnectedRepository(input: { userId: number; githubRepositoryId: string; owner: string; name: string; defaultBranch: string; installationId: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for GitHub repository onboarding.");
  const existing = await db.select({ id: repositories.id }).from(repositories)
    .where(and(eq(repositories.userId, input.userId), eq(repositories.githubRepositoryId, input.githubRepositoryId))).limit(1);
  const values = { owner: input.owner, name: input.name, defaultBranch: input.defaultBranch, installationId: input.installationId, connectionStatus: "connected" as const };
  if (existing[0]) {
    await db.update(repositories).set(values).where(eq(repositories.id, existing[0].id));
    return existing[0].id;
  }
  const inserted = await db.insert(repositories).values({ userId: input.userId, githubRepositoryId: input.githubRepositoryId, ...values });
  return Number(inserted[0].insertId);
}

export async function listRepositoryFindings(repositoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(riskFindings).where(eq(riskFindings.repositoryId, repositoryId)).orderBy(desc(riskFindings.riskScore));
}

export async function persistProvenancePlan(repositoryId: number, plan: ProvenancePlan) {
  if (!Number.isInteger(repositoryId) || repositoryId < 1) {
    throw new Error("A valid repository ID is required to persist a provenance plan.");
  }

  const db = await getDb();
  if (!db) {
    throw new Error("Database is not available for provenance persistence.");
  }

  try {
    for (const node of plan.nodes) {
      const existing = await db
        .select({ id: provenanceNodes.id })
        .from(provenanceNodes)
        .where(
          and(
            eq(provenanceNodes.scopeKey, node.scopeKey),
            eq(provenanceNodes.nodeKind, node.nodeKind),
            eq(provenanceNodes.logicalKey, node.logicalKey),
            eq(provenanceNodes.revisionKey, node.revisionKey)
          )
        )
        .limit(1);
      if (existing.length > 0) continue;

      await db.insert(provenanceNodes).values({
        id: node.id,
        scopeKey: node.scopeKey,
        nodeKind: node.nodeKind,
        logicalKey: node.logicalKey,
        revisionKey: node.revisionKey,
        contentSha256: node.contentSha256 ?? null,
        payloadJson: JSON.stringify(node.payload),
        sourceUrl: node.sourceUrl ?? null,
        observedAt: node.observedAt,
        parserVersion: node.parserVersion ?? null,
      });
    }

    for (const edge of plan.edges) {
      const existing = await db.select({ id: provenanceEdges.id }).from(provenanceEdges).where(eq(provenanceEdges.id, edge.id)).limit(1);
      if (existing.length > 0) continue;

      await db.insert(provenanceEdges).values({
        id: edge.id,
        scopeKey: edge.scopeKey,
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        relationType: edge.relationType,
        derivationMethod: edge.derivationMethod,
        derivationVersion: edge.derivationVersion,
        confidenceBasisPoints: edge.confidenceBasisPoints ?? null,
        evidenceLocatorJson: JSON.stringify(edge.evidenceLocator),
        analysisRunId: edge.analysisRunId ?? null,
      });
    }

    const findingNode = plan.nodes.find(node => node.nodeKind === "impact_finding");
    const changeNode = plan.nodes.find(node => node.nodeKind === "change_event");
    const repositoryNode = plan.nodes.find(node => node.nodeKind === "repository_revision");
    if (!findingNode || !changeNode || !repositoryNode) {
      throw new Error("Provenance plan is missing a required finding, change, or repository revision node.");
    }

    const packet = plan.evidencePacket;
    const externalId = `pipeline-${packet.findingId}`.slice(0, 128);
    const riskScore = calculateRiskScore({
      severity: packet.severity,
      codeReferenceConfidence: packet.confidence,
      executionSurface: packet.repository.codeEvidence.length,
      daysUntilDeadline: undefined,
    });
    const existingFinding = await db.select({ id: pipelineFindings.id }).from(pipelineFindings).where(eq(pipelineFindings.externalId, externalId)).limit(1);
    const findingValues = {
      findingNodeId: findingNode.id,
      changeNodeId: changeNode.id,
      repositoryRevisionNodeId: repositoryNode.id,
      provider: packet.change.provider,
      severity: packet.severity,
      title: packet.change.title,
      summary: packet.change.summary,
      sourceUrl: packet.change.source.sourceUrl,
      evidencePacketJson: JSON.stringify(packet),
      riskScore,
      confidence: Math.round(packet.confidence * 100),
      matcherVersion: packet.matcherVersion,
    };

    if (existingFinding.length > 0) {
      await db.update(pipelineFindings).set(findingValues).where(eq(pipelineFindings.id, existingFinding[0].id));
      return existingFinding[0].id;
    }

    const inserted = await db.insert(pipelineFindings).values({
      externalId,
      repositoryId,
      ...findingValues,
    });
    return Number(inserted[0].insertId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown provenance persistence error";
    throw new Error(`Failed to persist provenance plan: ${message}`);
  }
}

export async function listPipelineFindings(repositoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pipelineFindings).where(eq(pipelineFindings.repositoryId, repositoryId)).orderBy(desc(pipelineFindings.riskScore));
}

export async function getProviderPollState(provider: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerPollStates).where(eq(providerPollStates.provider, provider)).limit(1);
  return result[0];
}

export async function getProviderPollStateByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(providerPollStates).where(eq(providerPollStates.scheduleCronTaskUid, taskUid)).limit(1);
  return result[0];
}

export async function upsertProviderPollState(input: {
  provider: string;
  sourceUrl: string;
  scheduleCronTaskUid?: string | null;
  etag?: string | null;
  commitSha?: string | null;
  contentSha256?: string | null;
  lastAttemptAt?: Date | null;
  lastSuccessAt?: Date | null;
  lastStatus?: "idle" | "unchanged" | "changed" | "failed";
  lastError?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for provider polling state.");
  await db.insert(providerPollStates).values({
    provider: input.provider,
    sourceUrl: input.sourceUrl,
    scheduleCronTaskUid: input.scheduleCronTaskUid ?? null,
    etag: input.etag ?? null,
    commitSha: input.commitSha ?? null,
    contentSha256: input.contentSha256 ?? null,
    lastAttemptAt: input.lastAttemptAt ?? null,
    lastSuccessAt: input.lastSuccessAt ?? null,
    lastStatus: input.lastStatus ?? "idle",
    lastError: input.lastError ?? null,
  }).onDuplicateKeyUpdate({
    set: {
      sourceUrl: input.sourceUrl,
      scheduleCronTaskUid: input.scheduleCronTaskUid ?? null,
      etag: input.etag ?? null,
      commitSha: input.commitSha ?? null,
      contentSha256: input.contentSha256 ?? null,
      lastAttemptAt: input.lastAttemptAt ?? null,
      lastSuccessAt: input.lastSuccessAt ?? null,
      lastStatus: input.lastStatus ?? "idle",
      lastError: input.lastError ?? null,
    },
  });
}

export async function recordProviderPollRun(input: {
  provider: string;
  priorCommitSha?: string | null;
  nextCommitSha?: string | null;
  etag?: string | null;
  contentSha256?: string | null;
  outcome: "unchanged" | "changed" | "failed";
  changeCount?: number;
  errorSummary?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for provider poll auditing.");
  await db.insert(providerPollRuns).values({
    ...input,
    priorCommitSha: input.priorCommitSha ?? null,
    nextCommitSha: input.nextCommitSha ?? null,
    etag: input.etag ?? null,
    contentSha256: input.contentSha256 ?? null,
    changeCount: input.changeCount ?? 0,
    errorSummary: input.errorSummary?.slice(0, 1000) ?? null,
  });
}

export async function getRepositoryForUser(repositoryId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(repositories).where(and(eq(repositories.id, repositoryId), eq(repositories.userId, userId))).limit(1);
  return result[0];
}

export async function recordRepositoryScanRun(input: {
  repositoryId: number;
  commitSha: string;
  status: "succeeded" | "failed";
  fileCount?: number;
  dependencyCount?: number;
  codeEvidenceCount?: number;
  errorSummary?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available for repository scan auditing.");
  await db.insert(repositoryScanRuns).values({
    ...input,
    fileCount: input.fileCount ?? 0,
    dependencyCount: input.dependencyCount ?? 0,
    codeEvidenceCount: input.codeEvidenceCount ?? 0,
    errorSummary: input.errorSummary?.slice(0, 1000) ?? null,
  });
  if (input.status === "succeeded") {
    await db.update(repositories).set({ lastScannedAt: new Date() }).where(eq(repositories.id, input.repositoryId));
  }
}
