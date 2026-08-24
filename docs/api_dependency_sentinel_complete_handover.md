# API Dependency Sentinel — Complete Product and Business Handover

**Prepared for:** Product founder  
**Product:** API Dependency Sentinel  
**Operating stage:** Early B2B SaaS / design-partner validation  
**Product URL:** [https://venturesig-e4ipjaps.manus.space](https://venturesig-e4ipjaps.manus.space)  
**Current principle:** The product uses read-only repository access, produces evidence for a human reviewer, and does not modify customer code in the first release.

## 1. What This Product Is

API Dependency Sentinel is a software tool for engineering teams whose product depends on external services such as Stripe, OpenAI, and Twilio. Those services change their APIs, SDKs, models, documentation, and operational behavior over time. Each provider publishes change information, but that information normally arrives as a changelog entry that engineers must interpret and then manually connect to their own code. Stripe, OpenAI, and Twilio all maintain public change sources, but none of those sources knows which customer repositories, files, owners, or tests may be affected. [1] [2] [3]

Sentinel bridges that gap. It watches official provider sources, compares real revisions, reads a customer-selected GitHub repository with minimum required permissions, and tries to map a concrete external change to relevant TypeScript or Node.js evidence. It then produces a source-backed finding for a person to review. It is **not** an autonomous code-writing or auto-merging tool.

> **Plain-language promise:** When an outside API changes, Sentinel helps the engineering team find the likely affected code and decide what to review before the change becomes surprise work.

| In one sentence | What Sentinel does |
|---|---|
| Detection | Watches selected official provider change sources on a schedule. |
| Mapping | Searches the connected repository for deterministic evidence of likely usage. |
| Explanation | Preserves the source, code evidence, match method, and provenance trail. |
| Workflow | Presents a reviewer workspace and prepares a human-approved next step. |
| Safety | Uses read-only repository access and performs no writes to customer code in v1. |

## 2. What Has Been Built

The published application is a full-stack TypeScript product built with React, Vite, tRPC, Drizzle ORM, and a MySQL-compatible database. The main operating components are live and the core product flow has been covered by automated tests and production checks.

| Capability | Current implementation | Why it matters |
|---|---|---|
| GitHub-first onboarding | Customer authorizes a GitHub App and explicitly chooses an installed repository. | Removes the need to upload source code or give repository write access. |
| Minimum repository access | The GitHub App uses repository contents read access plus required metadata access. | The first version can inspect code without changing it. |
| Repository scanner | Retrieves selected repository content and extracts TypeScript/Node dependency and AST evidence. | Creates the customer-private code evidence that a provider changelog lacks. |
| Provider adapters | Stripe OpenAPI, OpenAI changelog, and Twilio OpenAPI adapters fetch and normalize official source changes. | Supports the first three high-signal provider categories: payments, AI, and communications. |
| Durable polling | Provider state, ETags, commit cursors, audit rows, and recent source history are stored durably. | Avoids reprocessing the same source revision and leaves an operational audit record. |
| Change-to-code matcher | Deterministically compares structured source deltas against scanned code evidence. | Produces a reviewable starting point instead of a generic change alert. |
| Provenance graph | Stores source, code, dependency, matching, and finding relationships. | Lets a reviewer understand *why* a finding exists. |
| Reviewer workspace | Shows the connected repository, scan status, poll status, and persisted findings. | Gives an engineering owner one place to assess signals. |
| One-click full analysis | Re-scans the connected repository and reconciles eligible provider revisions into review findings. | Makes the proof workflow accessible after connection. |
| Scheduled monitoring | Stripe, OpenAI, and Twilio monitors run on a six-hour cadence; Stripe’s recovered job has subsequently produced successful scheduled deliveries. | Provides continuous collection without a developer manually checking provider sites. |

### The Product Flow

| Step | What happens | Human control point |
|---:|---|---|
| 1 | A user opens the product URL and chooses **Connect GitHub**. | The user decides whether to begin authorization. |
| 2 | The GitHub App authorization and installation flow limits selectable repositories to those the user is permitted to connect. | The user chooses the repository. |
| 3 | Sentinel performs a read-only scan to find relevant package, import, endpoint, and AST evidence. | No repository content is changed. |
| 4 | Scheduled adapters collect official provider revisions and retain audit state. | The customer can review monitor status. |
| 5 | The user runs **Full analysis** in the reviewer workspace. | The user chooses when to analyze. |
| 6 | The matcher creates a finding only when it has deterministic source-to-code evidence. | A reviewer evaluates confidence and relevance. |
| 7 | The team uses the source, code location, and recommended review work to decide what to do. | No remediation is applied automatically. |

## 3. How to Access and Operate the Tool

### Accessing the Product

Open **[https://venturesig-e4ipjaps.manus.space](https://venturesig-e4ipjaps.manus.space)** in a browser. The public home page explains the product’s promise, evidence model, pricing hypothesis, and GitHub connection entry point. The internal reviewer workspace appears after GitHub-first authorization and explicit repository selection.

| Task | How to perform it | Expected result |
|---|---|---|
| Connect a repository | Choose **Connect GitHub**, authorize the GitHub App, and select a repository already available to the installation. | The chosen repository appears in the authenticated workspace. |
| Review repository health | Open the live reviewer workspace after connection. | Repository name, scan status, scan time, and provider poll timing are visible. |
| Run an analysis | Choose **Run full analysis** in the workspace. | Sentinel runs a read-only scan, refreshes provider reconciliation, and updates review data. |
| Inspect a finding | Open a persisted finding from the workspace list. | The provider source, code evidence, confidence, matcher version, and provenance are available for review. |
| Disconnect / restrict scope | Adjust the GitHub App installation from GitHub, then remove or change the selected repository in the product flow. | Access remains limited to the repositories explicitly chosen in GitHub. |

### Recommended First Customer Session

The first customer conversation should use one real repository and one supported provider the team already depends on. Do not promise that the first scan will create a finding. The correct purpose of the first session is to validate the repository connection, inspect the discovered evidence surface, learn the team’s integration-maintenance workflow, and define what would make a future finding useful.

1. Ask the engineering lead to name a recent provider change, deprecation, integration incident, or manual repository search.
2. Connect one non-sensitive, representative repository through the GitHub App.
3. Review the scanned dependency and code-evidence surface with the technical owner.
4. Run full analysis and inspect any resulting evidence together.
5. Label each result as useful, not useful, or needing more evidence.
6. Offer continuous monitoring only if the team sees a recurring review problem worth solving.

## 4. Security, Privacy, and Operational Boundaries

Sentinel’s first-release security posture is deliberately narrow. This is a commercial advantage because engineering buyers are often more willing to trial a tool that observes and explains than one that can change code, open tickets, or merge pull requests without adequate controls.

| Area | Current boundary |
|---|---|
| GitHub permissions | Read-only repository contents plus mandatory metadata; no repository write permission in the first release. |
| Code actions | Sentinel does not commit, push, merge, modify, or delete customer repository files. |
| Finding creation | A finding is persisted only when deterministic source-to-code matching criteria are met. |
| Human review | Findings are presented for reviewer assessment; the user decides whether any remediation is warranted. |
| Provider evidence | Source links, revision references, content hashes, structured deltas, and polling audit data support inspection. |
| Customer isolation | Customer repository evidence is scoped to the connected repository and is not a shared training corpus or cross-customer source-code dataset. |
| Credentials | Sensitive credentials and GitHub App secrets are stored as managed environment secrets, not in source code. |

The current product is not yet a complete enterprise-security program. Before selling annual enterprise contracts, the company should prepare a customer-facing permission diagram, data retention statement, incident-response process, vendor-subprocessor inventory, audit-log export policy, SSO plan, and security questionnaire response pack.

## 5. Current Operational Status and Honest Limitations

The core system is deployed and monitoring. Stripe, OpenAI, and Twilio provider checks are operational on a six-hour cadence, with durable audit records. The recovered Stripe job has logged successful scheduled runs after recovery. A real OpenAI changelog source baseline is retained for future comparison.

The most important caveat is that the product must **not** claim a live customer-impact finding until a genuine provider revision creates a deterministic match in the connected repository and the reviewer workspace displays that persisted result. Recent real provider revisions have been retained and inspected, but the current test repository has not yet produced the required live match. This is not a product failure; it is an evidence threshold the team should preserve rather than bypass with invented data.

| Proven today | Still to prove |
|---|---|
| GitHub connection, read-only scanning, scheduled provider polling, durable evidence state, structured diffs, one-click analysis, and reviewer workspace behavior. | A genuine changed provider revision that deterministically matches connected customer code, persists a finding, and is accepted by a reviewer. |
| Automated tests cover success, failure, cross-provider matching pathways, and reviewer refresh behavior. | Repeatable customer value: accepted-finding rate, time-to-triage reduction, and paid retention. |
| The first five design-partner messages have verified recipient candidates and approved official routes. | A repeatable outbound-to-discovery-to-pilot conversion rate. |

## 6. The Business Model

The business is a **B2B SaaS product for integration-heavy engineering teams**. The initial buyer is usually an engineering leader responsible for platform reliability, integrations, developer productivity, or partner/API maintenance. The product is sold as a recurring monitoring and evidence workflow, not as a one-time changelog report.

### Customer Problem and Economic Logic

The customer does not buy “alerts.” They buy faster, more confident handling of an external change that could otherwise require manual triage across unknown code, owners, tests, and releases. The core economic metric is therefore **time from provider change to owner-approved action**, not raw alert volume.

| Buyer | Existing pain | Sentinel outcome to measure |
|---|---|---|
| VP Engineering | Surprise integration work interrupts roadmap delivery. | Faster triage and clearer code ownership. |
| Platform / developer productivity lead | Engineers manually search repositories when upstream services change. | Less manual discovery work per accepted finding. |
| Product engineering lead | A dependency change may affect a revenue-critical user flow. | Earlier review of the likely code path and test plan. |
| Security or compliance partner | Automation that can write code introduces governance risk. | Read-only evidence and an auditable human approval step. |

### Pricing Hypothesis

The pricing below is a test plan, not current revenue. The initial outreach uses **$149/month** for continuous monitoring after a useful read-only Risk Map. A lower self-serve tier and a larger business tier should be validated with customer interviews and conversion data, rather than assumed.

| Tier | Target user | Included value boundary | Pricing hypothesis |
|---|---|---|---:|
| Starter | Small SaaS team with one repository and supported providers. | One repository, three initial providers, review workspace. | $39–$79 per month |
| Team | Integration-heavy product team. | Multiple repositories, scheduled monitoring, ownership, issue/test-plan exports. | $149–$399 per month |
| Business / Enterprise | Multi-team software company. | SSO, audit controls, policy rules, more providers/languages, security review, customer success. | Annual contract after validated demand |

At the $149/month Team starting point, the revenue math is transparent:

| Paying teams | Monthly recurring revenue | Annualized recurring revenue | What it would demonstrate |
|---:|---:|---:|---|
| 10 | $1,490 | $17,880 | Early willingness to pay for a narrow, useful workflow. |
| 100 | $14,900 | $178,800 | A repeatable self-serve or light-touch sales motion. |
| 500 | $74,500 | $894,000 | A meaningful recurring developer-tools business. |
| 1,000 | $149,000 | $1,788,000 | A basis for a multi-product, larger-account expansion story. |

These are arithmetic illustrations based on the stated $149 monthly hypothesis. They are not forecasts, contracted revenue, or valuation claims.

## 7. Why This Can Become a Large Company

The company should not be positioned as “a better changelog reader,” because that is easy to reproduce. The scalable opportunity is a **change-to-work control layer** for software that relies on external platforms.

| Scaling engine | Product today | Next expansion | Buyer impact |
|---|---|---|---|
| Provider coverage | Stripe, OpenAI, Twilio. | Identity, cloud, database, observability, CRM, and customer-defined providers. | One workflow for more external dependency risk. |
| Language coverage | TypeScript and Node evidence. | Python, Java, Go, C#, Terraform, configuration, and infrastructure-as-code. | Broader adoption across real production estates. |
| Outcome depth | Finding with likely code and provenance. | Ownership routing, test selection, ticket export, CI annotations, and approved remediation drafts. | Faster resolution, not merely better detection. |
| Risk intelligence | Individual repository findings. | Integration risk register, change readiness score, service-owner map, and executive reporting. | Makes external dependency risk measurable. |
| Distribution | Direct GitHub App connection. | GitHub Marketplace, GitLab, Bitbucket, CI, ticketing, chat, and engineering platforms. | Embeds Sentinel into existing engineering workflow. |
| Defensibility | Provider adapters, matching logic, provenance, and private customer evidence. | Provider-specific taxonomy, outcome feedback, ownership graphs, and policy controls. | Trust and workflow value strengthen over time without pooling customer code. |

The defensibility is **not** ownership of customer source code. Customer code must remain private. The moat is a maintained collection of provider adapters, normalized change taxonomies, evidence quality, auditable provenance, customer-private ownership mapping, and learning from reviewer outcomes.

## 8. Product Roadmap and Milestones

The roadmap should be earned through evidence. Building many features before confirming that customers value the initial source-to-code workflow would dilute the company’s focus.

| Phase | Horizon | Product objective | Decision metric |
|---|---:|---|---|
| 0 — Prove the wedge | Now to 60 days | Create real provider-change findings that reviewers accept as useful. | 3 design partners, 5+ reviewed findings, acceptance/rejection reasons recorded. |
| 1 — Make it repeatable | 60–120 days | Improve reliability and export findings into existing work systems. | 10 paying teams, 60%+ actionable reviewer rating, time-to-triage baseline. |
| 2 — Build the risk register | 4–9 months | Add ownership, policy, risk scoring, issue/chat/CI delivery, and more languages. | 25–50 paying teams, account expansion, weekly workflow usage. |
| 3 — Change-control platform | 9–18 months | Offer customer-defined providers, richer reporting, and optional approved remediation generation. | Multi-product expansion and repeatable sales motion. |

## 9. Marketing and Sales Plan

The initial go-to-market approach is founder-led and narrow. Broad marketing should wait until the product can show a permissioned or anonymized evidence walkthrough from a real provider change to a real review decision.

| Channel | What to say | What to avoid | Success signal |
|---|---|---|---|
| Design-partner outreach | “Find the likely owning code before a provider change becomes an incident.” | Claims that every change is caught or every outage is prevented. | Discovery calls with teams that can name a recent integration-maintenance problem. |
| Technical proof content | Show provider source → code evidence → reviewer decision. | Generic AI or alerting claims without evidence. | Qualified repository-install requests. |
| GitHub distribution | Emphasize read-only access, setup clarity, and provenance. | Undocumented permissions or automatic remediation claims. | Install-to-connected-repository conversion. |
| Partner ecosystems | Offer the Risk Map as a maintenance-service add-on. | Treating every agency or community as a sales channel. | Referral conversations and qualified pilot introductions. |
| Community learning | Ask focused workflow questions where community rules permit. | Cross-posting or unsolicited promotion. | Interview permission and maintenance insights. |

### Current Outreach Status

Five individually approved first-wave messages have been prepared with current public recipient candidates and official business routes: n8n, Activepieces, Cal.com, Voiceflow, and Tray.ai. Activepieces has been submitted through its official sales form, based on the founder’s confirmation. Cal.com remains pending a confirmed final submission. The remaining approved channels should be handled one at a time and logged with date, route, and result.

No company should be represented as a customer, design partner, or supporter unless it has explicitly agreed.

## 10. Investor Case

The investor narrative is not “we monitor APIs.” It is:

> **Software teams increasingly depend on fast-changing external platforms. API Dependency Sentinel builds the evidence and workflow layer that turns an external change into owned, reviewable engineering work before it becomes a production surprise.**

The first investor goal is validation capital and expert feedback, not a large fundraising process before the product has evidence of recurring customer value. Publicly relevant investor and accelerator starting points include Y Combinator’s active application route, boldstart’s focus on technical founders and AI-native infrastructure/security, Engineering Capital’s early technical-insight approach, and later-stage infrastructure practices such as a16z Infra. [4] [5] [6] [7]

| Target | Why it may fit | Minimum credible proof before a serious outreach push |
|---|---|---|
| Y Combinator | Active early-stage application route and product-led founder fit. | Working demo, truthful founder narrative, connected repository, monitor evidence, and a clear learning agenda. |
| boldstart | Focus on technical founders and AI-native infrastructure/security. | Three design-partner interviews and one credible evidence-to-code workflow demonstration. |
| Engineering Capital | Publicly describes early, technical-insight-led seed investments. | Technical proof, specific target-account thesis, and accepted-finding evidence. |
| a16z Infra | Strong platform fit only after traction and category evidence. | Paying teams, retention, expansion evidence, and broad control-layer story. |

### Questions an Investor Will Ask

| Question | Credible answer today | Proof still needed |
|---|---|---|
| Why cannot each company build this internally? | A company can build a script for one provider. Sentinel’s proposed value is maintained multi-provider adapters, normalized evidence, provenance, and workflow integration. | Buyers choosing Sentinel over maintaining internal scripts. |
| Is this a feature or a company? | It is a feature if it stays a changelog alert. It becomes a company by owning the ongoing change-to-work workflow, evidence, policy, ownership, and resolution metrics. | Repeated use across repositories and providers. |
| Why now? | Providers keep publishing API, model, pricing, deprecation, and operational changes. [1] [2] [3] | Interviews that quantify the cost of late discovery. |
| What is defensible? | Trustworthy adapters, customer-private evidence graphs, provenance, workflow placement, and reviewer outcome history. | Acceptance data, provider breadth, integration depth, and retention. |
| What unlocks the next round? | Paid retention and expansion, not inflated alert counts. | 10–25 paying teams, accepted-finding outcomes, multi-repository use, repeatable acquisition. |

This section is a strategic fundraising plan, not personalized investment advice or a valuation opinion.

## 11. Operating Plan for the Next 30, 60, and 90 Days

| Period | Primary goal | Required actions | Do not do |
|---|---|---|---|
| Next 30 days | Prove customer pain and collect a live evidence example. | Complete approved outbound messages, hold discovery calls, log outcomes, monitor genuine revisions, instrument reviewer outcomes. | Do not fabricate a finding, claim revenue, or expand provider coverage without a customer signal. |
| Days 31–60 | Convert learning into a narrow paid pilot. | Offer a read-only Risk Map, produce one permissioned/anonymized proof artifact, test $149/month only after useful value is visible. | Do not add broad enterprise features before repeatable workflow value appears. |
| Days 61–90 | Establish repeatability. | Add the most requested workflow feature, target 3–10 paying teams, measure accepted-finding rate and time-to-triage. | Do not pursue a large investor process without concrete learning and early conversion evidence. |

### Weekly Founder Dashboard

Track the following metrics in a simple founder-controlled spreadsheet or CRM:

| Metric | Definition | Why it matters |
|---|---|---|
| Qualified conversations | Discovery calls with an integration owner who can name a real maintenance workflow. | Tests whether the problem is painful and reachable. |
| Connected repositories | Repositories explicitly connected by qualified prospects. | Tests onboarding friction and trust. |
| Provider revisions observed | Genuine changes detected by the monitored sources. | Confirms collection activity, not customer value by itself. |
| Deterministic findings | Persisted findings that meet the evidence threshold. | Measures product throughput. |
| Accepted findings | Findings the customer calls useful or acts upon. | Primary signal of product value. |
| Time-to-triage | Time from provider change to a reviewer-approved next action. | Core customer outcome. |
| Pilot conversion | Risk Maps that convert to paid monitoring. | Validates pricing and sales motion. |
| Monthly recurring revenue | Contracted recurring subscription revenue only. | Prevents confusing pipeline with revenue. |

## 12. Key Risks and How to Handle Them

| Risk | Why it matters | Practical response |
|---|---|---|
| Too few high-quality matches | A system that produces no useful findings cannot justify recurring spend. | Focus on supported provider/repository combinations, improve evidence rules from reviewer feedback, and measure false negatives/positives honestly. |
| Noise or false positives | Engineering teams will ignore a noisy tool. | Preserve the deterministic threshold, show provenance, and let reviewers classify results. |
| “This is just a feature” objection | Buyers or investors may see changelog monitoring as easy to replicate. | Sell the workflow: provider source → private code evidence → owner → review → outcome. |
| Security friction | Repository access is sensitive. | Keep permissions minimal, document boundaries, and avoid write access until a customer case proves a need. |
| Unclear willingness to pay | Attention does not prove a business. | Offer a narrowly scoped Risk Map first, then test paid continuous monitoring only after visible value. |
| Premature enterprise work | Large buyers may ask for SSO, compliance, integrations, and custom providers early. | Treat requests as evidence; build only the features repeated by qualified prospects. |

## 13. Immediate Operating Checklist

1. Complete the remaining individually approved outreach only through the exact official channels already documented.
2. Log every submission, reply, discovery call, objection, and follow-up date.
3. Confirm the Cal.com submission before counting it as sent.
4. Continue provider monitoring; never seed or manufacture a source revision or customer finding.
5. When a genuine match occurs, run full analysis, capture the reviewer outcome, and obtain permission before publishing any case study detail.
6. Complete 10–15 discovery calls before materially changing the product positioning or pricing.
7. Apply to YC only with a truthful current-state narrative; seek specialist investor conversations after customer evidence improves.

## References

[1]: https://docs.stripe.com/changelog "Stripe Changelog"
[2]: https://platform.openai.com/docs/changelog "OpenAI API Changelog"
[3]: https://www.twilio.com/changelog "Twilio Product Changelog"
[4]: https://www.ycombinator.com/apply "Apply to Y Combinator"
[5]: https://boldstart.vc/ "boldstart ventures"
[6]: https://engineeringcapital.com/ "Engineering Capital"
[7]: https://a16z.com/infra/ "a16z Infrastructure"
