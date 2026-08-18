import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { afterEach, describe, expect, it } from "vitest";
import { pipelineFindings, provenanceEdges, provenanceNodes, repositories, users } from "../drizzle/schema";
import { getDb, listPipelineFindings, persistProvenancePlan } from "./db";
import { buildPipelinePreviewArtifact } from "./intelligence/pipelinePreview";
import { buildProvenancePlan } from "./intelligence/provenance";

describe("pipeline persistence database integration", () => {
  const token = `pipeline-e2e-${nanoid(10)}`;
  let userId: number | undefined;
  let repositoryId: number | undefined;
  let planNodeIds: string[] = [];
  let planEdgeIds: string[] = [];

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    for (const edgeId of planEdgeIds) {
      await db.delete(provenanceEdges).where(eq(provenanceEdges.id, edgeId));
    }
    for (const nodeId of planNodeIds) {
      await db.delete(provenanceNodes).where(eq(provenanceNodes.id, nodeId));
    }
    if (repositoryId) await db.delete(pipelineFindings).where(eq(pipelineFindings.repositoryId, repositoryId));
    if (userId) await db.delete(users).where(eq(users.id, userId));
  });

  it("writes and retrieves provenance graph nodes, edges, and a materialized reviewer finding", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    if (!db) return;

    const userInsert = await db.insert(users).values({ openId: `${token}-user`, name: "Pipeline Test User", role: "user" });
    userId = Number(userInsert[0].insertId);
    const repositoryInsert = await db.insert(repositories).values({
      userId,
      owner: "sentinel-fixtures",
      name: `${token}-repository`,
      defaultBranch: "main",
      connectionStatus: "demo",
    });
    repositoryId = Number(repositoryInsert[0].insertId);

    const artifact = buildPipelinePreviewArtifact();
    const plan = buildProvenancePlan(artifact.candidate, `test:${token}`);
    planNodeIds = plan.nodes.map(node => node.id);
    planEdgeIds = plan.edges.map(edge => edge.id);

    const persistedFindingId = await persistProvenancePlan(repositoryId, plan);
    const persistedNodes = await db.select().from(provenanceNodes).where(eq(provenanceNodes.scopeKey, `test:${token}`));
    const persistedEdges = await db.select().from(provenanceEdges).where(eq(provenanceEdges.scopeKey, `test:${token}`));
    const reviewerFindings = await listPipelineFindings(repositoryId);

    expect(persistedFindingId).toBeGreaterThan(0);
    expect(persistedNodes.map(node => node.nodeKind)).toEqual(expect.arrayContaining(["repository_revision", "code_location", "impact_finding"]));
    expect(persistedEdges.map(edge => edge.relationType)).toEqual(expect.arrayContaining(["SUPPORTED_BY", "CONTAINS"]));
    expect(reviewerFindings).toHaveLength(1);
    expect(reviewerFindings[0]).toMatchObject({ provider: "stripe", matcherVersion: "ts-direct-v1" });
  }, 30_000);
});
