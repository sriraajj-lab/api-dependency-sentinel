# Provider Intelligence, Provenance, and TypeScript Matcher Architecture

**Product:** API Dependency Sentinel  
**Author:** Manus AI  
**Status:** MVP architecture brief  
**Scope:** Stripe, OpenAI, and Twilio provider ingestion; auditable evidence tracing; TypeScript/Node repository matching.

## Executive design decision

The platform should be built as an **evidence pipeline**, not a changelog summarizer. Every finding must prove a continuous chain:

```text
Official provider source
  → immutable source snapshot
  → normalized change and affected API/SDK subject
  → repository dependency and commit
  → specific AST-derived code location
  → deterministic matching rule and score
  → human-reviewable finding
```

An LLM can improve the wording of a remediation recommendation, but it must never be the only reason a finding exists. The admissible proof is the provider source, the captured versioned artifact, the repository commit, and the exact code evidence.

> **Design rule:** A reviewer must be able to reproduce a finding later even if the provider page, repository default branch, or model behavior has changed.

## 1. Provider Adapters layer

### 1.1 Adapter contract

Every provider implementation should satisfy the same five-stage contract. Do not allow provider-specific scraping logic to write directly into change or finding tables.

| Stage | Input | Output | Reliability responsibility |
|---|---|---|---|
| Discover | Adapter configuration and cursor | Candidate source locators | Find feeds, release commits, changelog entries, schema URLs, and deprecation pages without creating duplicate work. |
| Acquire | Source locator | Immutable `SourceSnapshot` | Fetch with timeouts, conditional requests, redirect limits, content-type checks, source URL, retrieval time, and SHA-256. |
| Parse | Snapshot | Parsed source facts | Extract headings, dates, tags, links, structured schema objects, and source anchors. Preserve parse warnings. |
| Normalize | Parsed facts | `ProviderRevision` and `ChangeEvent` | Convert provider vocabulary into Sentinel’s canonical model without losing the original vocabulary. |
| Reconcile | New revision plus prior revision | Added/removed/changed subjects | Perform deterministic structured diffs, link superseded claims, and issue idempotent change events. |

```ts
type ProviderAdapter = {
  provider: "stripe" | "openai" | "twilio";
  discover(cursor: AdapterCursor): Promise<SourceLocator[]>;
  acquire(locator: SourceLocator): Promise<SourceSnapshot>;
  parse(snapshot: SourceSnapshot): Promise<ParsedProviderFact[]>;
  normalize(facts: ParsedProviderFact[]): Promise<ProviderRevision[]>;
  reconcile(input: {
    revision: ProviderRevision;
    priorRevision?: ProviderRevision;
  }): Promise<ChangeEvent[]>;
};
```

The scheduler is generic. It stores a per-source cursor containing the last successful ETag, Last-Modified value, release/commit identifier, content hash, and retrieval timestamp. The adapter should be deterministic: replaying the same snapshot must produce the same normalized identifiers and change subjects.

### 1.2 Source hierarchy and failure policy

Treat source classes differently. A page that describes a change is useful context; a versioned OpenAPI document or provider release commit is stronger evidence for exact endpoint and field-level impact.

| Source class | Purpose | Acceptance rule | Persistence rule |
|---|---|---|---|
| Versioned schema or SDK release | Exact structured diff | Preferred for subject-level claims | Store original bytes in object storage; retain hash and revision identity indefinitely. |
| Official changelog or deprecation notice | Human intent, rollout date, migration advice | Required for business context and deadline claims | Store rendered/normalized text, source URL, heading anchor, excerpt hash, and capture time. |
| Official RSS/Atom feed | Efficient discovery | Discovery only; fetch linked canonical article before creating a high-severity event | Retain feed entry and linked article snapshot. |
| Provider documentation page | Supplement schema gaps | Use only with anchored excerpt and source snapshot | Never infer a removal purely from changed prose. |
| Third-party article or issue | Triage signal only | Cannot independently create a customer finding | Keep outside the proof chain or label as unverified context. |

The acquisition service should apply bounded retries with exponential backoff for transient errors, persist an `acquisition_failed` run event after the retry budget, and leave the last known valid revision active. It must not infer a deletion from a failed fetch, an empty response, or a provider 429/5xx response.

### 1.3 Provider-specific source plans

#### Stripe adapter

Stripe supplies an official developer changelog with release grouping, affected products, categories, and an explicit breaking-change indicator. Its OpenAPI repository provides GA and preview specifications; the repository describes `latest/` as the recommended GA source with both v1 and v2 endpoints, while `preview/` includes public-preview endpoints. [1] [2]

Stripe also documents that API version upgrades can change request parameters, response object structure, and webhook payloads; it distinguishes backward-compatible monthly releases from major releases that can require code updates. [3]

| Adapter input | Acquisition method | Normalized use |
|---|---|---|
| Developer changelog entry | Crawl index, then fetch canonical entry URL | `ChangeEvent` title, announced/effective date, provider classification, explicit breaking flag, migration text. |
| `stripe/openapi` GA commit | Git commit/release cursor; retrieve `latest/spec3.json` or YAML at commit SHA | Endpoint, request/response property, enum, requiredness, and webhook-event structural diffs. |
| `stripe/openapi` preview commit | Separate preview cursor | Create preview-only events; never alert a customer at production severity unless the repository explicitly uses preview artifacts. |
| API-version upgrade guidance | Versioned documentation snapshot | Attach `api_version` applicability and webhook-version impact guidance. |

**Stripe normalization rules.** Preserve the provider release label, API version, product, category, and explicit breaking marker. A changed JSON Schema property is represented separately from the human announcement. Link the announcement to one or more changed subjects; do not assume every changelog entry maps to a single OpenAPI operation.

#### OpenAI adapter

OpenAI publishes an official API changelog and states that Markdown versions of documentation pages can be obtained by appending `.md`; it separately directs users to the deprecations page for upcoming deprecations. [4] The official `openai/openai-openapi` repository publishes an OpenAPI 3.1 specification with endpoints, authentication, parameters, and request/response schemas. [5]

| Adapter input | Acquisition method | Normalized use |
|---|---|---|
| API changelog and deprecations pages | Fetch Markdown representation when available; capture date and tagged API/model references | Model availability, endpoint changes, feature changes, migration windows, and deprecation deadlines. |
| `openai/openai-openapi` commits | Poll GitHub commit SHA; fetch `openapi.json` at SHA | OpenAPI operation and schema property diffs. |
| Official Node SDK releases | Optional second adapter after the REST baseline works | SDK export, method, option, and type changes that may precede or exceed REST-schema detail. |

**OpenAI normalization rules.** Model aliases, snapshots, endpoints, tools, and SDK exports are distinct subjects. A model retirement must be represented as a `model_identifier` change with an effective date; it is not an endpoint removal. Alias changes should default to medium severity unless the provider explicitly deprecates/removes a model or the customer pins that exact identifier in source/configuration.

#### Twilio adapter

Twilio provides an official product changelog with an RSS feed, and its official OpenAPI repository states that its documents are kept up to date and are used to validate Twilio API requests. [6] [7] Twilio documents its OpenAPI 3.0 files as inputs for mocking, testing, client generation, and ecosystem tooling. [8]

| Adapter input | Acquisition method | Normalized use |
|---|---|---|
| Product changelog RSS | Poll feed with ETag/Last-Modified; fetch each canonical entry | Discovery, product tags, announcement date, and operational deadline. |
| Linked changelog article | Canonical HTML/Markdown snapshot | Migration language, affected product, effective date, and source excerpt. |
| `twilio/twilio-oai` commit | Commit cursor; retrieve relevant YAML/JSON artifact at SHA | REST endpoint, request field, response field, and enum changes. |
| Official Node helper-library release | Optional second adapter | Package-version and SDK method compatibility mapping. |

**Twilio normalization rules.** The product namespace is mandatory. `Messaging`, `Verify`, `Voice`, `Conversations`, and SendGrid must be distinct provider artifacts, even if they share a Twilio account. A certificate rotation or platform policy update should produce a `runtime_operational_change` subject, not a false endpoint diff.

### 1.4 Canonical provider objects

The following objects are sufficient for the first release. They are immutable by revision: corrections create a new revision linked to the prior one.

```ts
type ProviderArtifact = {
  provider: "stripe" | "openai" | "twilio";
  artifactKey: string; // e.g. stripe:openapi:latest, openai:rest:v1, twilio:messaging
  artifactKind: "rest_schema" | "sdk" | "changelog" | "deprecation_notice" | "runtime_notice";
};

type ProviderRevision = {
  revisionId: string; // content-addressed ULID or SHA-derived ID
  artifactKey: string;
  providerRevisionRef: string; // Git SHA, provider release label, or canonical entry ID
  observedAt: string;
  sourceSnapshotId: string;
  canonicalSha256: string;
  parserVersion: string;
};

type ChangeSubject = {
  subjectId: string;
  provider: "stripe" | "openai" | "twilio";
  subjectKind:
    | "http_operation"
    | "request_property"
    | "response_property"
    | "schema_property"
    | "enum_value"
    | "sdk_export"
    | "sdk_method"
    | "model_identifier"
    | "webhook_event"
    | "runtime_operational_change";
  canonicalName: string; // e.g. POST /v1/responses, stripe.paymentIntents.create
  namespace?: string; // Twilio product, Stripe product, OpenAI API family
  selector: Record<string, string>; // method/path, package/export, schema pointer, model ID
};

type ChangeEvent = {
  changeId: string;
  providerRevisionId: string;
  changeType: "added" | "removed" | "renamed" | "deprecated" | "behavior_changed" | "requiredness_changed" | "enum_changed";
  breakingAssessment: "provider_declared" | "structural" | "potential" | "unknown";
  effectiveAt?: string;
  subjectIds: string[];
  sourceClaimIds: string[];
};
```

## 2. Provenance Graph

### 2.1 Design principle

Use a relational store for transactions, authorization, and queryability; use object storage for immutable raw and normalized artifacts; build graph traversal through typed edge tables rather than adopting a graph database on day one. This keeps the MVP operationally simple while still allowing a reviewer to traverse the evidence chain.

The graph is append-only for analytic facts. A correction, parser improvement, or rescored finding creates a new `AnalysisRun`, `GraphNode`, or `GraphEdge`; it never overwrites prior evidence.

### 2.2 Node schema

```sql
CREATE TABLE provenance_nodes (
  node_id              CHAR(26) PRIMARY KEY,        -- ULID
  tenant_id            BIGINT NULL,                  -- NULL for public provider data
  node_kind            VARCHAR(48) NOT NULL,
  logical_key          VARCHAR(512) NOT NULL,
  revision_key         VARCHAR(512) NULL,
  content_sha256       CHAR(64) NULL,
  payload_json         JSON NOT NULL,
  object_storage_key   VARCHAR(1024) NULL,
  source_url           VARCHAR(2048) NULL,
  observed_at          DATETIME(3) NOT NULL,
  effective_at         DATETIME(3) NULL,
  parser_version       VARCHAR(64) NULL,
  created_at           DATETIME(3) NOT NULL,
  UNIQUE KEY uq_node_revision (tenant_id, node_kind, logical_key, revision_key)
);
```

`payload_json` must use a versioned schema identified by `node_kind`. The raw source body belongs in object storage, referenced by `object_storage_key`; do not store repository file bodies or provider documents as unrestricted database blobs.

| Node kind | Logical key | Required payload fields |
|---|---|---|
| `source_snapshot` | Canonical URL + retrieval hash | `httpStatus`, `contentType`, `etag`, `lastModified`, `retrievedAt`, `bodySha256`, `captureMethod`. |
| `provider_revision` | Provider artifact + provider revision reference | `provider`, `artifactKind`, `providerRevisionRef`, `canonicalSha256`, `parserVersion`. |
| `change_subject` | Provider + canonical subject name | `subjectKind`, `canonicalName`, `namespace`, `selector`. |
| `change_event` | Provider revision + structural diff fingerprint | `changeType`, `breakingAssessment`, `effectiveAt`, `summary`, `changeFingerprint`. |
| `repository_revision` | Repository full name + commit SHA | `installationId`, `repositoryId`, `fullName`, `commitSha`, `defaultBranch`, `treeSha`, `capturedAt`. |
| `dependency_declaration` | Repo revision + manifest location + package | `ecosystem`, `packageName`, `declaredRange`, `resolvedVersion`, `manifestPath`, `lockfilePath`. |
| `code_location` | Repo revision + path + AST span fingerprint | `path`, `startLine`, `endLine`, `startOffset`, `endOffset`, `astKind`, `symbolText`, `snippetSha256`. |
| `analysis_run` | Analyzer version + input revision set | `matcherVersion`, `ruleBundleVersion`, `startedAt`, `completedAt`, `status`, `inputHashes`. |
| `impact_finding` | Change event + repo revision + code fingerprint | `severity`, `confidence`, `status`, `dedupeKey`, `scoreBreakdown`, `summary`. |
| `remediation_decision` | Finding + action timestamp | `decision`, `actorId`, `comment`, `externalIssueUrl`, `approvedAt`. |

### 2.3 Edge schema

```sql
CREATE TABLE provenance_edges (
  edge_id              CHAR(26) PRIMARY KEY,
  tenant_id            BIGINT NULL,
  from_node_id         CHAR(26) NOT NULL,
  to_node_id           CHAR(26) NOT NULL,
  relation_type        VARCHAR(64) NOT NULL,
  derivation_method    VARCHAR(32) NOT NULL,
  derivation_version   VARCHAR(64) NOT NULL,
  confidence           DECIMAL(5,4) NULL,
  evidence_locator     JSON NOT NULL,
  created_by_run_id    CHAR(26) NULL,
  created_at           DATETIME(3) NOT NULL,
  INDEX idx_edge_from (from_node_id, relation_type),
  INDEX idx_edge_to (to_node_id, relation_type)
);
```

| Relation | From → To | Meaning |
|---|---|---|
| `SNAPSHOT_OF` | `source_snapshot` → canonical source identity | A captured immutable representation of a source. |
| `PARSED_INTO` | `source_snapshot` → `provider_revision` | Parser generated a normalized revision from this exact capture. |
| `DECLARES_CHANGE` | `provider_revision` → `change_event` | Versioned source introduced the event. |
| `AFFECTS_SUBJECT` | `change_event` → `change_subject` | Event changes a specific endpoint, SDK symbol, field, model, or runtime behavior. |
| `PINNED_BY` | `repository_revision` → `dependency_declaration` | Repository revision declares or resolves the provider package. |
| `CONTAINS` | `repository_revision` → `code_location` | Source location exists at the captured commit. |
| `USES_SUBJECT` | `code_location` → `change_subject` | AST, literal, or resolver rule matched code to a provider subject. |
| `SUPPORTED_BY` | `impact_finding` → any evidence node | Finding cites a required proof component. |
| `GENERATED_BY` | `impact_finding` → `analysis_run` | Identifies exact matcher and rule versions that produced the result. |
| `SUPERSEDES` | new node → old node | Retains correction/reanalysis lineage. |

### 2.4 Evidence locator contract

An edge is not auditable unless it identifies the exact supporting fragment. `evidence_locator` is therefore mandatory and type-checked by relation.

```ts
type EvidenceLocator =
  | {
      kind: "provider_document";
      url: string;
      heading?: string;
      anchor?: string;
      excerpt: string;
      excerptSha256: string;
      snapshotSha256: string;
    }
  | {
      kind: "schema_pointer";
      objectStorageKey: string;
      snapshotSha256: string;
      jsonPointer: string;
      beforeValue?: unknown;
      afterValue?: unknown;
    }
  | {
      kind: "repository_ast";
      repositoryFullName: string;
      commitSha: string;
      path: string;
      startLine: number;
      endLine: number;
      astKind: string;
      snippetSha256: string;
    }
  | {
      kind: "dependency_manifest";
      repositoryFullName: string;
      commitSha: string;
      manifestPath: string;
      packageName: string;
      declaredRange?: string;
      resolvedVersion?: string;
      snippetSha256: string;
    };
```

A finding must have, at minimum, one provider-source edge, one repository-revision edge, and one code/dependency edge. If a direct code location cannot be found, the finding may be saved as an **inventory exposure** but must not be presented as a confirmed code-path impact.

### 2.5 Finding evidence packet

The product UI should retrieve a compact materialized view rather than traverse the graph client-side.

```ts
type FindingEvidencePacket = {
  findingId: string;
  tenantId: number;
  provider: "stripe" | "openai" | "twilio";
  change: {
    id: string;
    type: string;
    breakingAssessment: string;
    announcedAt?: string;
    effectiveAt?: string;
    sourceUrl: string;
    sourceExcerpt: string;
  };
  repository: {
    fullName: string;
    commitSha: string;
    defaultBranch: string;
  };
  exposures: Array<{
    path: string;
    lines: [number, number];
    matchKind: "direct_sdk_call" | "import" | "endpoint_literal" | "model_literal" | "dependency_only";
    subject: string;
    evidence: EvidenceLocator;
  }>;
  score: {
    confidence: number;
    severity: "critical" | "high" | "medium" | "low";
    reasons: string[];
  };
  reproducibility: {
    analysisRunId: string;
    matcherVersion: string;
    ruleBundleVersion: string;
    sourceSnapshotHashes: string[];
  };
};
```

## 3. Minimum viable Change-to-Code Matcher for TypeScript/Node

### 3.1 Explicit MVP boundary

Do **not** build a full interprocedural code property graph in the first release. The initial matcher should only make claims it can substantiate from the repository’s default branch at a known commit.

| Include in MVP | Exclude until evidence quality warrants it |
|---|---|
| `package.json`, lockfiles, and workspace manifests | Dynamic runtime package loading through arbitrary string construction |
| TypeScript/JavaScript imports and CommonJS `require()` calls | Cross-repository call graphs and microservice tracing |
| Direct SDK construction and direct property-chain calls | Whole-program alias analysis or arbitrary dependency injection containers |
| Literal REST paths, provider hostnames, and model identifiers | Heuristic claims based only on comments or natural-language documentation |
| Same-file/simple re-export aliases | Automatic code changes, issue creation, or pull requests |
| Test files as supporting exposure evidence | Source retrieval outside the selected GitHub repository scope |

This scope is commercially useful because it produces high-confidence direct findings while allowing the product to label everything else accurately as inventory-only or unconfirmed.

### 3.2 Repository scan pipeline

```text
GitHub Push / installation event
  → capture repository default-branch SHA
  → fetch manifest and selected source tree at SHA
  → resolve dependency inventory
  → parse TypeScript/JavaScript AST
  → emit code-location and subject-use facts
  → join provider change subjects against facts
  → score, deduplicate, and write evidence packet
```

Use the TypeScript compiler API (`typescript.createSourceFile`) in the first implementation. It is already capable of parsing TypeScript and JavaScript syntax and avoids a separate parser dependency. Parse source text in memory, but persist only the minimal location, hash, symbol text, and allowed excerpt required for review; raw source should remain in controlled object storage with tenant isolation.

### 3.3 Dependency inventory rules

Start with these package aliases:

| Provider | Package candidates | Initial subject map |
|---|---|---|
| Stripe | `stripe`, `@stripe/stripe-js`, `stripe-node` legacy naming if encountered | `stripe.paymentIntents.create`, `stripe.customers.create`, HTTP endpoint path, webhook event. |
| OpenAI | `openai`, `@openai/*` when officially supported | `openai.responses.create`, `openai.chat.completions.create`, model identifiers, REST endpoints. |
| Twilio | `twilio`, `@twilio/*` product packages | `twilio.messages.create`, `twilio.verify.v2.services`, Voice/Messaging endpoint paths. |

The resolver should store both the declared semver range and the lockfile-resolved version. A changed SDK surface is actionable only when the installed resolved version is within the affected range or when the repository is configured to float a range that can admit the affected version.

### 3.4 AST facts to collect

For every source file, emit compact facts rather than retaining an expensive graph.

```ts
type ImportBindingFact = {
  kind: "import_binding" | "require_binding";
  packageName: string;
  localName: string;
  importedName?: string;
  path: string;
  span: [number, number];
};

type ClientConstructionFact = {
  kind: "client_construction";
  provider: "stripe" | "openai" | "twilio";
  localName: string; // e.g. client, stripe, openai
  constructorName: string;
  path: string;
  span: [number, number];
};

type DirectCallFact = {
  kind: "direct_sdk_call";
  provider: "stripe" | "openai" | "twilio";
  receiverName: string;
  propertyChain: string[]; // e.g. ["responses", "create"]
  canonicalCandidate: string; // e.g. openai.responses.create
  path: string;
  span: [number, number];
  enclosingSymbol?: string;
};

type LiteralFact = {
  kind: "endpoint_literal" | "model_literal" | "webhook_event_literal";
  provider: "stripe" | "openai" | "twilio";
  value: string;
  path: string;
  span: [number, number];
};
```

Recognize only transparent patterns in v1:

```ts
import OpenAI from "openai";
const client = new OpenAI();
await client.responses.create({ model: "gpt-4.1" });

import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
await stripe.paymentIntents.create({ amount: 1000, currency: "usd" });

import twilio from "twilio";
const client = twilio(accountSid, authToken);
await client.messages.create({ to, from, body });
```

For each direct call, extract the receiver binding, property chain, enclosing function or exported handler when available, path, line span, AST node kind, and a SHA-256 of the normalized snippet. This is adequate to map a source-level change to a repeatable internal code location.

### 3.5 Rule-driven matching

The provider adapter emits `ChangeSubject` records. The matcher uses a small, reviewed rule bundle to translate a subject into evidence patterns.

```ts
type MatcherRule = {
  ruleId: string;
  provider: "stripe" | "openai" | "twilio";
  subjectSelector: Record<string, string>;
  packageNames: string[];
  codePatterns: Array<
    | { kind: "property_chain"; value: string[] }
    | { kind: "literal"; value: string }
    | { kind: "rest_operation"; method: string; path: string }
  >;
  requiredEvidence: Array<"dependency" | "import" | "direct_call" | "literal">;
  baseConfidence: number;
};
```

Example: an OpenAI change subject for `POST /v1/responses` can map to `openai.responses.create`, the endpoint literal `/v1/responses`, and a direct fetch call to `api.openai.com`. A direct SDK call plus a resolved `openai` dependency is high confidence; a string literal alone is medium or low confidence, depending on context.

### 3.6 Deterministic scoring

Use transparent scoring, not an opaque model score.

| Evidence | Score contribution | Constraint |
|---|---:|---|
| Resolved affected dependency version | +0.20 | Required for SDK-version findings. |
| Import/require from affected package | +0.20 | Package must match provider rule. |
| Direct client construction | +0.15 | Same file or safely resolved local alias. |
| Direct SDK property-chain call | +0.35 | Must equal canonical/mapped subject. |
| Exact endpoint/model/event literal | +0.25 | Cannot alone create a high-confidence finding. |
| Source in a test file only | −0.15 | Still valuable, but lower production confidence. |
| Unresolved dynamic property access | cap at 0.45 | Do not present as confirmed impact. |

Suggested confidence bands are **confirmed** (≥0.80), **likely** (0.55–0.79), and **inventory exposure** (<0.55). Only confirmed and likely findings should enter the default review queue; inventory exposures remain searchable supporting context.

### 3.7 Dedupe and lifecycle

Use a deterministic dedupe key:

```text
sha256(change_event_id | repository_id | commit_sha | code_location_snippet_sha256 | matcher_rule_id)
```

When the default branch changes, re-run only affected files where possible. A finding becomes `resolved_by_code_change` only after the exact evidence no longer matches at a later repository SHA; it must not disappear silently. A finding becomes `superseded_by_provider_revision` when a later provider revision changes or withdraws the original claim.

## 4. Operating sequence

| Step | Trigger | Idempotency key | Durable output |
|---|---|---|---|
| Ingest provider source | Poll, RSS entry, or Git commit change | Provider artifact + source hash | `source_snapshot`, `provider_revision`. |
| Compute provider diff | New normalized revision | Prior revision + new revision + parser version | `change_event`, `change_subject`, source evidence edges. |
| Capture repository revision | GitHub installation or Push event | Installation + repository + commit SHA | `repository_revision`. |
| Index repository | New repo SHA or matcher version change | Repository SHA + matcher version | Dependency and AST fact nodes. |
| Generate impacts | Relevant provider change or repository update | Change ID + repository SHA + rule bundle version | `impact_finding`, evidence packet. |
| Review outcome | Human action | Finding ID + action timestamp | `remediation_decision`; no automatic write-back in v1. |

## 5. Four-week prototype plan

| Week | Deliverable | Exit criterion |
|---|---|---|
| 1 | Stripe-only adapter, immutable snapshots, schema diff for a restricted endpoint set | A Stripe changelog item and OpenAPI diff produce source-linked `ChangeEvent` records. |
| 2 | TypeScript repository snapshot, manifest resolver, AST import/direct-call scanner | A controlled test repository yields exact `stripe.*` or `openai.*` call locations at a commit SHA. |
| 3 | Provenance edges, deterministic scoring, reviewer evidence packet | Every test finding can display provider excerpt, schema pointer, package evidence, file path, lines, and matcher rule. |
| 4 | Add OpenAI and Twilio adapters; run with three design partners | Measure precision of confirmed/likely findings and collect explicit dismiss-reason feedback. |

The prototype should intentionally decline difficult cases. A precise system that says “unconfirmed wrapper or dynamic call” is more credible than a broad system that invents impact.

## 6. Implemented prototype status

The initial prototype now includes a Stripe OpenAPI adapter and deterministic structured diff, a TypeScript/Node dependency and AST extractor, direct-call matching, and an evidence-plan builder. A public workspace route presents a clearly labelled controlled fixture that runs those real modules end to end. The fixture is intentionally not presented as a customer finding.

The database schema includes append-only provenance nodes and edges plus materialized pipeline findings. An authenticated server procedure authorizes the repository against the current user before persisting a plan, and a separate authenticated reviewer route returns only the selected user’s stored findings and evidence packets. Unauthenticated visitors remain on the public pipeline preview and cannot access saved evidence.

The production deployment was verified after rollout by calling the published `sentinel.pipelinePreview` procedure. It returned the expected Stripe structured-diff finding, repository commit, and provenance-backed evidence payload rather than the prior demonstration data.

A final browser verification of the published `/workspace` route confirmed that the rendered page now shows the Pipeline Evidence Preview, the isolated Stripe structured-diff fixture, the matched TypeScript code location, the repository commit, the matcher version, and the provenance-chain summary.

## References

[1]: https://docs.stripe.com/changelog "Stripe Developer Changelog"
[2]: https://github.com/stripe/openapi "Stripe OpenAPI Specification"
[3]: https://docs.stripe.com/upgrades "Stripe API Upgrades"
[4]: https://developers.openai.com/api/docs/changelog "OpenAI API Changelog"
[5]: https://github.com/openai/openai-openapi "OpenAI OpenAPI Specification"
[6]: https://www.twilio.com/en-us/changelog "Twilio Product Changelog and RSS Feed"
[7]: https://github.com/twilio/twilio-oai "Twilio OpenAPI Specification"
[8]: https://www.twilio.com/docs/openapi "Twilio OpenAPI Documentation"
