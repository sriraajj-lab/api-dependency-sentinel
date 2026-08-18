# Live Pipeline Operations Contract

## Purpose and initial scope

The first live extension turns the existing evidence pipeline into a deterministic background service. It polls the Stripe OpenAPI source every six hours, uses only the GitHub App’s short-lived read-only installation token to inspect the isolated `sriraajj-lab/api-dependency-sentinel-test` repository, and normalizes OpenAI and Twilio source material into the existing `ProviderChange` contract.

The initial six-hour cadence deliberately favours reliable, low-noise change capture over near-real-time polling. It can later be changed through the project-level job configuration without replacing the handler or data model.

The deployed project now has a single enabled project-level job named `stripe-revision-poll-primary` targeting `/api/scheduled/stripe-poll` on the six-hour UTC cadence. Its platform task identifier is stored only in the durable provider cursor state, which the callback checks before it accepts a cron delivery.

## Safety and idempotency contract

| Concern | Required behaviour |
|---|---|
| Source freshness | Stripe requests send the last ETag in `If-None-Match` and record the upstream Git commit SHA separately from the content hash. A `304 Not Modified` advances the attempt timestamp without creating a new snapshot or finding. |
| Change identity | A change is keyed by provider, canonical subject, prior revision, and next revision. Replaying a scheduled delivery must update existing materialized findings rather than create duplicates. |
| Repository scope | A scan first enumerates repositories through the installation token and rejects a requested repository if it is absent from that installation. The scanner never uses the owner’s personal token. |
| Repository data minimization | The scanner fetches only text files relevant to dependency manifests and TypeScript/JavaScript evidence, enforces a file-count and file-size cap, and stores compact evidence facts—not complete source trees—in the database. |
| Scheduled delivery authentication | The callback is limited to `/api/scheduled/stripe-poll`, validates the platform cron identity, dereferences state by the platform task identifier, and returns an idempotent 2xx response for orphaned jobs. |
| Failure handling | Source-fetch and GitHub failures are written as bounded diagnostic state, returned as JSON 5xx responses for safe retry, and never overwrite the last verified cursor. |
| Tenant isolation | Global provider-source nodes use the public provenance scope. Repository revisions, code facts, scans, and materialized findings remain scoped to the owning repository and authenticated user. |

## Acceptance checks

The implementation is complete only when the following are true:

1. A conditional Stripe request returns a durable ETag and commit cursor; a repeated unchanged request is recognized without a snapshot write.
2. The scheduled callback is authenticated, idempotent, and can be invoked against the deployed handler.
3. A short-lived GitHub App installation token reads the selected test repository’s default-branch files and produces `RepositoryEvidence` from GitHub content rather than local fixture files.
4. OpenAI and Twilio adapters produce normalized source snapshots and deterministic change objects using the shared contracts.
5. The complete test suite covers unchanged polling, changed polling, repository authorization, and three-provider adapter output.

## Adapter source ledger

| Provider | Primary source | Adapter evidence strategy |
|---|---|---|
| OpenAI | [Official API changelog](https://developers.openai.com/api/docs/changelog) | Snapshot the official dated changelog document, retain its content hash, and normalize entries with their month/date heading and named API model, endpoint, or SDK surface as a document-excerpt locator. The official page has a dedicated changelog heading and month-level dated sections. |
| Twilio | [Official OpenAPI repository](https://github.com/twilio/twilio-oai) and [product changelog](https://www.twilio.com/en-us/changelog) | Prefer versioned OpenAPI documents for operation-level differences; use official changelog excerpts only when a structured surface is not available. The official repository exposes a `spec` directory, Git commit history, tags, and a `CHANGES.md` record, enabling an adapter to record both a document path and immutable commit reference. |
