# Startup Idea Discovery Checklist

- [x] Define a scored decision framework for pain intensity, urgency, buyer clarity, and acquisition leverage.
- [x] Generate focused startup wedges grounded in the ecosystem research rather than generic AI categories.
- [x] Check the leading wedges against live competitors and buyer behaviour.
- [x] Select one concept and specify the first user, product promise, distribution loop, and MVP boundary.
- [x] Write a 30-day customer-discovery and validation plan with measurable pass/fail criteria.

# Rapid-MRR Direction Checklist

- [x] Define the financial and buyer-speed criteria for a fast-MRR startup wedge.
- [x] Compare the existing concept with faster-monetizing alternatives.
- [x] Validate the leading candidate’s buyer urgency, pricing model, and strategic-acquirer relevance.
- [x] Deliver one recommended concept with an initial revenue proof plan.

# Company-Specific Local Model Evaluation Checklist

- [x] Translate the local micro-LLM proposal into a precise product architecture and buyer promise.
- [x] Research existing private-AI, small-model, RAG, and agent-workflow offerings.
- [x] Assess realistic deployment, cost, model-quality, security, and support constraints.
- [x] Identify a narrow paid-pilot wedge with a rapid MRR path and repeatable deployment model. Deprioritized after API Dependency Sentinel was selected as the launch product.
- [x] Decide whether this idea should outrank ScopeLock and ProofPass, and document the validation plan. Deprioritized after API Dependency Sentinel was selected as the launch product.

# Reverse-Agent Concept Checklist

- [x] Define the reverse-agent principle: observe repeated work, infer the workflow, and propose a bounded agent with approval gates.
- [x] Research current agent builders, process-mining tools, and agent-observability products to avoid a generic agent platform.
- [x] Generate narrow reverse-agent wedges with a direct buyer, a measurable outcome, and a low-friction data source. Deprioritized after API Dependency Sentinel was selected as the launch product.
- [x] Select the strongest fast-MRR concept and define its 30-day proof plan. Deprioritized after API Dependency Sentinel was selected as the launch product.

# AI Operations Cartographer Checklist

- [x] Define the ingest-to-diagnosis-to-approved-agent loop, including explanation, control, and audit boundaries.
- [x] Compare the concept with process mining, process intelligence, agent builders, and AI transformation platforms.
- [x] Select one repeatable operational problem as the launch wedge rather than promising to optimize every company.
- [x] Define a paid diagnostic and implementation model that can demonstrate recurring value and MRR.

# Workprint Novelty Scan Checklist

- [x] Define the exact feature combination that would count as a direct Workprint match.
- [x] Collect and verify direct competitors across process intelligence, task mining, agent generation, and AI transformation.
- [x] Compare competitors feature by feature and identify any defensible product boundary.
- [x] Decide whether to pursue, narrow, or stop the Workprint concept. Stopped in favor of API Dependency Sentinel as the launch product.

# Fast-MRR Winner Sprint Checklist

- [x] Define scored winner criteria for novelty, implementation speed, buyer urgency, pricing, distribution, and strategic value.
- [x] Generate a diverse set of non-generic workflow wedges from current market and startup signals.
- [x] Verify the strongest candidates against direct incumbents and realistic buyer behaviour.
- [x] Select one winner and specify the MVP, pricing hypothesis, acquisition loop, and 30-day revenue proof.

# API Dependency Sentinel Build Checklist

- [x] Define the GitHub-first MVP data model, risk-scoring logic, and supported-provider boundary.
- [x] Upgrade the project for secure user accounts, repository records, and future GitHub credentials.
- [x] Create brand assets and a launch-ready visual direction for the developer-security product.
- [x] Build the landing, GitHub connection, risk map, issue review, and pricing flows.
- [x] Prepare launch positioning, product-led acquisition assets, sales scripts, and design-partner outreach.
- [x] Verify core user journeys, capture final visual review feedback, and refine the MVP.
- [x] Add a recoverable risk-map query error state after final visual and runtime review.
- [x] Save and deliver the completed product and go-to-market materials.

# GitHub Connection Prerequisites

- [x] Verify the supplied GitHub credentials against the GitHub API without exposing them in project files or client code.
- [x] Determine whether an existing GitHub App is available and document any remaining server-side credential requirements.
- [x] Keep live GitHub installation and webhook flows disabled until an app ID, private key, and webhook secret are configured securely.
- [x] Obtain GitHub App credentials and webhook permissions to activate the already designed live installation and event flow.
- [x] Restore the missing workspace route and eliminate the frontend import failure.
- [x] Validate the GitHub App private key through server-side App authentication.
- [x] Run the full test suite and visually verify the landing and workspace experiences.
- [x] Save a new product checkpoint and deliver the validated MVP and launch handoff.
- [x] Verify the published Sentinel endpoint and document the canonical production URL.
- [x] Replace the GitHub App homepage with the published product URL.
- [x] Implement and validate the signed GitHub webhook callback before enabling live events.
- [x] Correct the GitHub App permission selection to Contents read-only and Copilot agent settings no access.
- [x] Install the GitHub App on a dedicated test repository with read-only repository contents.
- [x] Create the private api-dependency-sentinel-test repository with a synthetic integration fixture.
- [x] Confirm the test installation emits and accepts a signed GitHub delivery without accessing an existing customer project.
- [x] Produce an implementation-ready architecture brief for provider adapters, the provenance graph, and a TypeScript/Node change-to-code matcher.
- [x] Define the first pipeline schema and acceptance fixtures for Stripe changes, TypeScript repository evidence, and reviewable findings.
- [x] Implement and test the Stripe OpenAPI source adapter and structured diff baseline.
- [x] Implement and test TypeScript dependency inventory and direct SDK-call AST evidence extraction.
- [x] Persist provenance-backed impact findings and expose a reviewer evidence view in the workspace.
- [x] Wire provenance-plan persistence into an authenticated executable pipeline procedure.
- [x] Load persisted pipeline findings and evidence packets for the owning repository in the reviewer workspace.
- [x] Add an end-to-end integration test that verifies provenance and pipeline-finding rows are written and readable.
- [x] Run an end-to-end fixture validation, publish the pipeline, and document the handoff.
- [x] Verify the published production workspace serves the updated pipeline evidence view.
- [x] Re-open the published workspace after rollout and confirm the rendered page shows the Stripe pipeline evidence preview.
- [x] Define safe cursor, retry, idempotency, and tenant-isolation requirements for scheduled provider polling.
- [x] Implement and test scheduled Stripe revision polling using durable ETag and commit cursors.
- [x] Register the project-level Stripe polling job and persist its task identifier in the provider cursor state.
- [x] Verify the deployed cron callback updates Stripe polling state and bounded audit records after a real execution.
- [x] Implement and test a read-only GitHub installation scan of api-dependency-sentinel-test.
- [x] Implement and test normalized OpenAI and Twilio change adapters.
- [x] Validate live polling, installed-repository extraction, and three-provider evidence output before production release.
- [x] Design, implement, and validate scheduled OpenAI and Twilio provider polling with durable cursor state and compact audit records.
- [x] Verify a real scheduled OpenAI callback advances durable provider state and writes a bounded audit record.
- [x] Verify a real scheduled Twilio callback advances durable provider state and writes a bounded audit record.
- [x] Build and validate an authenticated repository-connection onboarding flow that securely lists permitted GitHub App repositories and records an owner-selected connection.
- [x] Prepare ten research-backed design-partner outreach drafts from the sales playbook and establish a review-and-approval sending workflow.
- [x] Verify official public integration evidence for every company represented in the ten-draft design-partner outreach cohort.
- [x] Diagnose and fix the live repository-onboarding sign-in flow that fails to load after the user starts authentication.
- [x] Diagnose and fix the blank external authorization page shown during live repository-onboarding sign-in. Replaced the unavailable external portal with GitHub-first onboarding.
- [x] Revalidate the live OAuth portal after a normal Manus browser session is available; the current external authorization surface remains blank despite the product route and OAuth handoff tests passing. Superseded by the validated GitHub-first flow.
- [x] Replace the unavailable external Manus sign-in handoff with a GitHub-first, server-issued session that permits only verified read-only repository onboarding.
- [x] Add a repository-status card showing the connected repository, last scan timestamp, and Stripe, OpenAI, and Twilio poll timestamps.
- [x] Enable a one-click authenticated pipeline scan immediately after a verified repository connection, with clear in-progress, success, and failure states.
- [x] Validate the new repository-status and one-click scan experience with automated coverage and production browser verification.
- [x] Implement a one-click protected full pipeline action that scans the selected repository and refreshes persisted review findings, not only scan metadata.
- [x] Add success, failure, and post-run finding-refresh tests for the full one-click pipeline action, then confirm it in the production workspace.
- [ ] Persist source-backed impact findings from actual changed provider revisions when the one-click pipeline detects deterministic code matches.
- [x] Present the ten prepared design-partner outreach drafts for user review and collect explicit per-batch send approval before external delivery.
- [x] Build an investor-ready business thesis covering the customer pain, market wedge, defensibility, pricing, and milestone-based funding case.
- [x] Create a concise live product demo script and investor collateral anchored in the validated repository connection, polling, and source-backed matching workflow.
- [x] Prepare an investor-application answer bank, including founder narrative placeholders, company stage, traction evidence, and funding-use milestones.
- [x] Verify current public contact details and preferred channels for the approved ten-draft design-partner batch before asking for individual-send approval.
- [x] Extend one-click source-backed finding generation to all supported changed providers, including Stripe and OpenAI, using immutable revisions for OpenAPI providers and retained changelog revisions for OpenAI.
- [ ] Prove in automated and production validation that a full analysis run creates or refreshes persisted findings when deterministic source-backed matches exist and updates the reviewer workspace list.
- [x] Replace or complete the held outreach prospects so all ten approved drafts have a verified current public business channel before individual-send approval.
- [ ] Monitor the next genuine Stripe, OpenAI, or Twilio provider revision and complete the live proof only if it yields a deterministic match in the connected repository.
- [x] Confirm OpenAI and Twilio monitoring remains active, and refresh Stripe’s missed next-execution calculation without changing its source or callback.
- [ ] Verify the refreshed Stripe polling job completes at its next scheduled execution and writes a successful audit/log record, then reconfirm all three provider schedules are actively executing on their six-hour cadence.
- [ ] Recover the stalled Stripe Heartbeat job so it receives a future six-hour execution and retains its original authenticated callback behavior.
