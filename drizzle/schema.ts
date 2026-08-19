import { index, int, mediumtext, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const repositories = mysqlTable("repositories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  githubRepositoryId: varchar("githubRepositoryId", { length: 64 }),
  owner: varchar("owner", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  defaultBranch: varchar("defaultBranch", { length: 255 }).default("main").notNull(),
  installationId: varchar("installationId", { length: 64 }),
  connectionStatus: mysqlEnum("connectionStatus", ["demo", "connected", "attention", "disconnected"]).default("demo").notNull(),
  lastScannedAt: timestamp("lastScannedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Short-lived server-side GitHub App authorization handoffs; user tokens are never stored. */
export const githubConnectSessions = mysqlTable(
  "githubConnectSessions",
  {
    state: varchar("state", { length: 128 }).primaryKey(),
    userId: int("userId").references(() => users.id, { onDelete: "cascade" }),
    candidatesJson: text("candidatesJson"),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("github_connect_session_user_idx").on(table.userId, table.expiresAt)]
);

export const riskFindings = mysqlTable("riskFindings", {
  id: int("id").autoincrement().primaryKey(),
  repositoryId: int("repositoryId").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  externalId: varchar("externalId", { length: 128 }).notNull().unique(),
  provider: varchar("provider", { length: 64 }).notNull(),
  findingType: mysqlEnum("findingType", ["deprecation", "schema_change", "sdk_release", "behavior_change"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  status: mysqlEnum("status", ["needs_review", "triaged", "ignored", "resolved"]).default("needs_review").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  sourceUrl: text("sourceUrl").notNull(),
  sourceSummary: text("sourceSummary").notNull(),
  codeReferencesJson: text("codeReferencesJson").notNull(),
  ownerHint: varchar("ownerHint", { length: 255 }),
  riskScore: int("riskScore").notNull(),
  confidence: int("confidence").notNull(),
  deadlineAt: timestamp("deadlineAt"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Append-only evidence nodes. Provider source data uses the public scope while
 * repository facts and findings use the owning user's scope key.
 */
export const provenanceNodes = mysqlTable(
  "provenanceNodes",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    scopeKey: varchar("scopeKey", { length: 96 }).notNull(),
    nodeKind: varchar("nodeKind", { length: 48 }).notNull(),
    logicalKey: varchar("logicalKey", { length: 512 }).notNull(),
    revisionKey: varchar("revisionKey", { length: 512 }).notNull(),
    contentSha256: varchar("contentSha256", { length: 64 }),
    payloadJson: text("payloadJson").notNull(),
    sourceUrl: text("sourceUrl"),
    observedAt: timestamp("observedAt").notNull(),
    effectiveAt: timestamp("effectiveAt"),
    parserVersion: varchar("parserVersion", { length: 64 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("provenance_node_revision_idx").on(table.scopeKey, table.nodeKind, table.logicalKey, table.revisionKey),
    index("provenance_node_kind_idx").on(table.scopeKey, table.nodeKind),
  ]
);

/**
 * Typed graph edges preserve how every finding was derived from source, code,
 * dependency, and analysis facts. The locator points to a small reproducible
 * source fragment rather than storing complete documents or source trees.
 */
export const provenanceEdges = mysqlTable(
  "provenanceEdges",
  {
    id: varchar("id", { length: 26 }).primaryKey(),
    scopeKey: varchar("scopeKey", { length: 96 }).notNull(),
    fromNodeId: varchar("fromNodeId", { length: 26 }).notNull(),
    toNodeId: varchar("toNodeId", { length: 26 }).notNull(),
    relationType: varchar("relationType", { length: 64 }).notNull(),
    derivationMethod: varchar("derivationMethod", { length: 32 }).notNull(),
    derivationVersion: varchar("derivationVersion", { length: 64 }).notNull(),
    confidenceBasisPoints: int("confidenceBasisPoints"),
    evidenceLocatorJson: text("evidenceLocatorJson").notNull(),
    analysisRunId: varchar("analysisRunId", { length: 26 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("provenance_edge_from_idx").on(table.fromNodeId, table.relationType),
    index("provenance_edge_to_idx").on(table.toNodeId, table.relationType),
  ]
);

/**
 * Materialized reviewer records. They are intentionally separate from the
 * original riskFindings table while the live pipeline is introduced gradually.
 */
export const pipelineFindings = mysqlTable(
  "pipelineFindings",
  {
    id: int("id").autoincrement().primaryKey(),
    repositoryId: int("repositoryId").notNull().references(() => repositories.id, { onDelete: "cascade" }),
    externalId: varchar("externalId", { length: 128 }).notNull().unique(),
    findingNodeId: varchar("findingNodeId", { length: 26 }).notNull(),
    changeNodeId: varchar("changeNodeId", { length: 26 }).notNull(),
    repositoryRevisionNodeId: varchar("repositoryRevisionNodeId", { length: 26 }).notNull(),
    provider: varchar("provider", { length: 64 }).notNull(),
    severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
    status: mysqlEnum("status", ["needs_review", "triaged", "ignored", "resolved"]).default("needs_review").notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    summary: text("summary").notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    evidencePacketJson: text("evidencePacketJson").notNull(),
    riskScore: int("riskScore").notNull(),
    confidence: int("confidence").notNull(),
    matcherVersion: varchar("matcherVersion", { length: 64 }).notNull(),
    detectedAt: timestamp("detectedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("pipeline_finding_repository_idx").on(table.repositoryId, table.riskScore)]
);

/**
 * One durable cursor per monitored public provider source. The prior source body
 * is intentionally not retained: a changed Stripe revision is diffed by fetching
 * the prior committed revision from the provider's public source repository.
 */
export const providerPollStates = mysqlTable("providerPollStates", {
  provider: varchar("provider", { length: 64 }).primaryKey(),
  sourceUrl: text("sourceUrl").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  etag: varchar("etag", { length: 512 }),
  commitSha: varchar("commitSha", { length: 128 }),
  contentSha256: varchar("contentSha256", { length: 64 }),
  lastAttemptAt: timestamp("lastAttemptAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastStatus: mysqlEnum("lastStatus", ["idle", "unchanged", "changed", "failed"]).default("idle").notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Compact immutable attempt records provide operational traceability without
 * duplicating provider documents. The content hash and revisions are sufficient
 * to reproduce a diff from public provider source history.
 */
export const providerPollRuns = mysqlTable(
  "providerPollRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    provider: varchar("provider", { length: 64 }).notNull(),
    priorCommitSha: varchar("priorCommitSha", { length: 128 }),
    nextCommitSha: varchar("nextCommitSha", { length: 128 }),
    etag: varchar("etag", { length: 512 }),
    contentSha256: varchar("contentSha256", { length: 64 }),
    outcome: mysqlEnum("outcome", ["unchanged", "changed", "failed"]).notNull(),
    changeCount: int("changeCount").default(0).notNull(),
    errorSummary: varchar("errorSummary", { length: 1000 }),
    executedAt: timestamp("executedAt").defaultNow().notNull(),
  },
  table => [index("provider_poll_run_provider_idx").on(table.provider, table.executedAt)]
);

/**
 * Compact retained provider-source bodies are used only for providers such as
 * OpenAI whose public changelog has no immutable history. Large OpenAPI files
 * are reproducibly retrieved by immutable public commit instead. Repository
 * source code is never retained in this table.
 */
export const providerSourceSnapshots = mysqlTable(
  "providerSourceSnapshots",
  {
    id: int("id").autoincrement().primaryKey(),
    provider: varchar("provider", { length: 64 }).notNull(),
    sourceKind: varchar("sourceKind", { length: 64 }).notNull(),
    sourceUrl: text("sourceUrl").notNull(),
    sourceRef: varchar("sourceRef", { length: 128 }).notNull(),
    contentSha256: varchar("contentSha256", { length: 64 }).notNull(),
    contentType: varchar("contentType", { length: 255 }).notNull(),
    body: mediumtext("body").notNull(),
    retrievedAt: timestamp("retrievedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    uniqueIndex("provider_snapshot_revision_idx").on(table.provider, table.contentSha256),
    index("provider_snapshot_lookup_idx").on(table.provider, table.retrievedAt),
  ]
);

/**
 * Repository scan metadata records the exact revision and bounded extraction
 * counts. Code facts remain in provenance; complete source file contents do not
 * enter the database.
 */
export const repositoryScanRuns = mysqlTable(
  "repositoryScanRuns",
  {
    id: int("id").autoincrement().primaryKey(),
    repositoryId: int("repositoryId").notNull().references(() => repositories.id, { onDelete: "cascade" }),
    commitSha: varchar("commitSha", { length: 128 }).notNull(),
    status: mysqlEnum("status", ["succeeded", "failed"]).notNull(),
    fileCount: int("fileCount").default(0).notNull(),
    dependencyCount: int("dependencyCount").default(0).notNull(),
    codeEvidenceCount: int("codeEvidenceCount").default(0).notNull(),
    errorSummary: varchar("errorSummary", { length: 1000 }),
    scannedAt: timestamp("scannedAt").defaultNow().notNull(),
  },
  table => [index("repository_scan_repository_idx").on(table.repositoryId, table.scannedAt)]
);

export type Repository = typeof repositories.$inferSelect;
export type RiskFinding = typeof riskFindings.$inferSelect;
export type ProvenanceNode = typeof provenanceNodes.$inferSelect;
export type ProvenanceEdge = typeof provenanceEdges.$inferSelect;
export type PipelineFinding = typeof pipelineFindings.$inferSelect;
export type ProviderPollState = typeof providerPollStates.$inferSelect;
export type ProviderPollRun = typeof providerPollRuns.$inferSelect;
export type ProviderSourceSnapshot = typeof providerSourceSnapshots.$inferSelect;
export type RepositoryScanRun = typeof repositoryScanRuns.$inferSelect;
