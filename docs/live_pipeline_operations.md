# Live Pipeline Operations Contract

## Purpose and initial scope

The first live extension turns the existing evidence pipeline into a deterministic background service. It polls the Stripe OpenAPI source every six hours, uses only the GitHub App’s short-lived read-only installation token to inspect the isolated `sriraajj-lab/api-dependency-sentinel-test` repository, and normalizes OpenAI and Twilio source material into the existing `ProviderChange` contract.

The initial six-hour cadence deliberately favours reliable, low-noise change capture over near-real-time polling. It can later be changed through the project-level job configuration without replacing the handler or data model.

The deployed project now has three enabled project-level jobs, each with a durable task identifier stored in its provider cursor state: `stripe-revision-poll-primary` targets `/api/scheduled/stripe-poll` at the top of each six-hour window, `openai-revision-poll-primary` targets `/api/scheduled/openai-poll` ten minutes later, and `twilio-revision-poll-primary` targets `/api/scheduled/twilio-poll` twenty minutes later. Each callback accepts only the platform cron identity whose task identifier maps to the matching provider.

The first production delivery exposed that Stripe no longer publishes the schema under `latest/spec3.json`. The adapter now resolves the current repository commit and acquires the canonical commit-pinned `openapi/spec3.json` document. A controlled recovery delivery returned HTTP 200 with a `changed` result, followed by an HTTP 200 `unchanged` confirmation; both preserved the six-hour schedule and wrote compact audit rows.

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
| Stripe | [Official OpenAPI repository](https://github.com/stripe/openapi) | Resolve the current `master` commit through GitHub, then acquire the immutable `openapi/spec3.json` document at that SHA. Preserve the response ETag, commit SHA, and content hash; derive operation and request-requiredness differences using schema pointers. |
| OpenAI | [Official API changelog](https://developers.openai.com/api/docs/changelog) | Send `If-None-Match` when an ETag is available; retain the ETag, a durable source reference, and content hash. Normalize dated entries with their month/date heading and named API model, endpoint, or SDK surface as a document-excerpt locator. |
| Twilio | [Official OpenAPI repository](https://github.com/twilio/twilio-oai) and [product changelog](https://www.twilio.com/en-us/changelog) | Resolve the `main` commit, acquire the immutable `spec/json/twilio_api_v2010.json` document at that revision, and retain commit SHA plus ETag. Compare operation removals only when a prior revision exists. |
