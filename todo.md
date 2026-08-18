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
- [ ] Save and deliver the completed product and go-to-market materials.

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
