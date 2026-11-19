CREATE TYPE "public"."connectionstatus_enum" AS ENUM('demo', 'connected', 'attention', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."findingtype_enum" AS ENUM('deprecation', 'schema_change', 'sdk_release', 'behavior_change');--> statement-breakpoint
CREATE TYPE "public"."laststatus_enum" AS ENUM('idle', 'unchanged', 'changed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."outcome_enum" AS ENUM('unchanged', 'changed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."scan_status_enum" AS ENUM('succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."severity_enum" AS ENUM('critical', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('needs_review', 'triaged', 'ignored', 'resolved');--> statement-breakpoint
CREATE TABLE "githubConnectSessions" (
	"state" varchar(128) PRIMARY KEY NOT NULL,
	"userId" integer,
	"candidatesJson" text,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipelineFindings" (
	"id" serial PRIMARY KEY NOT NULL,
	"repositoryId" integer NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"findingNodeId" varchar(26) NOT NULL,
	"changeNodeId" varchar(26) NOT NULL,
	"repositoryRevisionNodeId" varchar(26) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"severity" "severity_enum" NOT NULL,
	"status" "status_enum" DEFAULT 'needs_review' NOT NULL,
	"title" varchar(500) NOT NULL,
	"summary" text NOT NULL,
	"sourceUrl" text NOT NULL,
	"evidencePacketJson" text NOT NULL,
	"riskScore" integer NOT NULL,
	"confidence" integer NOT NULL,
	"matcherVersion" varchar(64) NOT NULL,
	"detectedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pipelineFindings_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "provenanceEdges" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"scopeKey" varchar(96) NOT NULL,
	"fromNodeId" varchar(26) NOT NULL,
	"toNodeId" varchar(26) NOT NULL,
	"relationType" varchar(64) NOT NULL,
	"derivationMethod" varchar(32) NOT NULL,
	"derivationVersion" varchar(64) NOT NULL,
	"confidenceBasisPoints" integer,
	"evidenceLocatorJson" text NOT NULL,
	"analysisRunId" varchar(26),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provenanceNodes" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"scopeKey" varchar(96) NOT NULL,
	"nodeKind" varchar(48) NOT NULL,
	"logicalKey" varchar(512) NOT NULL,
	"revisionKey" varchar(512) NOT NULL,
	"contentSha256" varchar(64),
	"payloadJson" text NOT NULL,
	"sourceUrl" text,
	"observedAt" timestamp NOT NULL,
	"effectiveAt" timestamp,
	"parserVersion" varchar(64),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providerPollRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(64) NOT NULL,
	"priorCommitSha" varchar(128),
	"nextCommitSha" varchar(128),
	"etag" varchar(512),
	"contentSha256" varchar(64),
	"outcome" "outcome_enum" NOT NULL,
	"changeCount" integer DEFAULT 0 NOT NULL,
	"errorSummary" varchar(1000),
	"executedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providerPollStates" (
	"provider" varchar(64) PRIMARY KEY NOT NULL,
	"sourceUrl" text NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	"etag" varchar(512),
	"commitSha" varchar(128),
	"contentSha256" varchar(64),
	"lastAttemptAt" timestamp,
	"lastSuccessAt" timestamp,
	"lastStatus" "laststatus_enum" DEFAULT 'idle' NOT NULL,
	"lastError" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providerSourceSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(64) NOT NULL,
	"sourceKind" varchar(64) NOT NULL,
	"sourceUrl" text NOT NULL,
	"sourceRef" varchar(128) NOT NULL,
	"contentSha256" varchar(64) NOT NULL,
	"contentType" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"retrievedAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"githubRepositoryId" varchar(64),
	"owner" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"defaultBranch" varchar(255) DEFAULT 'main' NOT NULL,
	"installationId" varchar(64),
	"connectionStatus" "connectionstatus_enum" DEFAULT 'demo' NOT NULL,
	"lastScannedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repositoryScanRuns" (
	"id" serial PRIMARY KEY NOT NULL,
	"repositoryId" integer NOT NULL,
	"commitSha" varchar(128) NOT NULL,
	"status" "scan_status_enum" NOT NULL,
	"fileCount" integer DEFAULT 0 NOT NULL,
	"dependencyCount" integer DEFAULT 0 NOT NULL,
	"codeEvidenceCount" integer DEFAULT 0 NOT NULL,
	"errorSummary" varchar(1000),
	"scannedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "riskFindings" (
	"id" serial PRIMARY KEY NOT NULL,
	"repositoryId" integer NOT NULL,
	"externalId" varchar(128) NOT NULL,
	"provider" varchar(64) NOT NULL,
	"findingType" "findingtype_enum" NOT NULL,
	"severity" "severity_enum" NOT NULL,
	"status" "status_enum" DEFAULT 'needs_review' NOT NULL,
	"title" varchar(500) NOT NULL,
	"sourceUrl" text NOT NULL,
	"sourceSummary" text NOT NULL,
	"codeReferencesJson" text NOT NULL,
	"ownerHint" varchar(255),
	"riskScore" integer NOT NULL,
	"confidence" integer NOT NULL,
	"deadlineAt" timestamp,
	"detectedAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "riskFindings_externalId_unique" UNIQUE("externalId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role_enum" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
ALTER TABLE "githubConnectSessions" ADD CONSTRAINT "githubConnectSessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipelineFindings" ADD CONSTRAINT "pipelineFindings_repositoryId_repositories_id_fk" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repositoryScanRuns" ADD CONSTRAINT "repositoryScanRuns_repositoryId_repositories_id_fk" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "riskFindings" ADD CONSTRAINT "riskFindings_repositoryId_repositories_id_fk" FOREIGN KEY ("repositoryId") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "github_connect_session_user_idx" ON "githubConnectSessions" USING btree ("userId","expiresAt");--> statement-breakpoint
CREATE INDEX "pipeline_finding_repository_idx" ON "pipelineFindings" USING btree ("repositoryId","riskScore");--> statement-breakpoint
CREATE INDEX "provenance_edge_from_idx" ON "provenanceEdges" USING btree ("fromNodeId","relationType");--> statement-breakpoint
CREATE INDEX "provenance_edge_to_idx" ON "provenanceEdges" USING btree ("toNodeId","relationType");--> statement-breakpoint
CREATE UNIQUE INDEX "provenance_node_revision_idx" ON "provenanceNodes" USING btree ("scopeKey","nodeKind","logicalKey","revisionKey");--> statement-breakpoint
CREATE INDEX "provenance_node_kind_idx" ON "provenanceNodes" USING btree ("scopeKey","nodeKind");--> statement-breakpoint
CREATE INDEX "provider_poll_run_provider_idx" ON "providerPollRuns" USING btree ("provider","executedAt");--> statement-breakpoint
CREATE UNIQUE INDEX "provider_snapshot_revision_idx" ON "providerSourceSnapshots" USING btree ("provider","contentSha256");--> statement-breakpoint
CREATE INDEX "provider_snapshot_lookup_idx" ON "providerSourceSnapshots" USING btree ("provider","retrievedAt");--> statement-breakpoint
CREATE INDEX "repository_scan_repository_idx" ON "repositoryScanRuns" USING btree ("repositoryId","scannedAt");