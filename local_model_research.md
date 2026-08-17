# Company-Specific Local Model Research

## Initial architecture translation

The proposed concept is not simply “train one new LLM per company.” The commercially viable interpretation is a **private Company Intelligence Appliance** comprising: an open-weight base model selected for a narrow workload; a company-specific retrieval and policy layer; optional lightweight task adaptation; local or customer-controlled inference; a visual workflow designer; and an agent runtime with human approvals and audit trails.

The promise should not be “buy once and never use another model.” Model updates, hardware, setup, security, and specialised task quality all carry recurring cost. The credible promise is: **“Keep selected company knowledge and routine workflows inside your environment, reduce per-token spend on high-volume repetitive work, and retain control over how agents act.”**

## External signal: small models and agents

**Source:** [Red Hat, “Small models, big impact: The future of scaling enterprise AI agents”](https://www.redhat.com/en/blog/small-models-big-impact-future-scaling-enterprise-ai-agents).

The article was accessed as an industry perspective on specialised small models and enterprise agent fleets. Its full body could not be preserved from the browser session, so it should be used only as directional evidence until corroborated with accessible primary documentation. The key research hypothesis to validate is that smaller models are appropriate for constrained, repeatable agent tasks, while production deployment still requires an operational layer for model selection, policy, observability, retrieval, and human control.

## Product implication

The high-risk version is selling a customised model installation to every company. That is consulting-heavy, slow to deploy, hard to support, and difficult to make into fast MRR.

The higher-potential version is selling a repeatable, vertical **workflow appliance** where the model is an implementation detail. A company pays monthly for an approved workflow that runs privately—for example, internal bid-package triage, controlled SOP answer-and-action, QA evidence review, or maintenance-record extraction—not for a bespoke “company LLM.”

## Private inference is possible, but operationally non-trivial

**Source:** [NVIDIA Technical Blog, “Simplify LLM Deployment and AI Inference with a Unified NVIDIA NIM Workflow”](https://developer.nvidia.com/blog/simplify-llm-deployment-and-ai-inference-with-unified-nvidia-nim-workflow/), 11 June 2025.

NVIDIA describes local or private model deployment as requiring model-format detection, architecture identification, quantization awareness, backend selection, optimized settings, and a running inference server. Its NIM product abstracts those tasks into a deployable container and selects among serving backends such as vLLM, SGLang, and TensorRT-LLM based on model and quantization characteristics.

**Implication:** The claim that a client can “buy once” and simply run a private company model hides ongoing work. Private deployment requires model selection, serving optimization, hardware compatibility, model updates, observability, and support. These requirements point to a recurring managed-service or appliance subscription, not a one-time model sale.

## A local model still needs model governance

**Source:** [IBM, “watsonx.ai v2.4: Expanding Governed AI Development for the Enterprise”](https://www.ibm.com/new/announcements/ibm-watsonx-ai-v2-4-expanding-governed-ai-development-for-the-enterprise), 19 June 2026.

IBM’s current enterprise architecture treats locally hosted models as one option behind a unified model gateway. It highlights administration of providers, models, secrets, policies, usage controls, authentication, audit records, tenant isolation, and OpenAI-compatible APIs. The company’s framing is that model choice must coexist with enterprise control across environments.

**Implication:** The defensible product is not “one private LLM.” It is a governed execution layer that gives a company privacy, source-grounded answers, controlled tools, approval gates, auditability, and the option to use a local small model for routine tasks while retaining a model gateway for exceptional tasks. The product must make the complexity disappear for a narrow buyer and workflow.

## Generic agentic knowledge layers are already products

**Source:** [Progress, “Agentic RAG Platform for AI Agents and LLMs”](https://www.progress.com/agentic-rag).

Progress positions Agentic RAG as central infrastructure for company knowledge across AI experiences. Its current capabilities include ingesting more than 30 file formats, hybrid search, chunking and metadata controls, model choice across more than 40 LLMs, continuous knowledge updates, source-cited answers, and answer-quality evaluation.

**Implication:** “Give every company its own private knowledge LLM with a workflow graph” is an existing horizontal category. It cannot be the initial product pitch. The opening must be a vertical workflow where the buyer pays for a completed, auditable outcome and the local model is a deployment advantage rather than the product itself.

## Construction estimating is already an AI battleground

**Source:** [Document Crunch, “AI Construction Estimating: Save Time and Cut Costs”](https://www.documentcrunch.com/blog/ai-construction-estimating), 5 November 2025.

Document Crunch describes current AI estimating systems as reading documents, BIM data, historical project data, supplier pricing, and external conditions to inform cost items, forecasts, and risk controls. It also frames historical project learning and automatic margin-risk flags as part of the value proposition.

**Implication:** Do not launch with generic “private AI bid analysis” or “AI estimating.” Those functions already have strong incumbent attention. A local workflow appliance should instead focus on a structured internal-control step that is mandatory, evidentiary, and difficult to perform reliably with generic RAG—for example, redlining a subcontractor’s proposed exclusions against a master scope and automatically routing exceptions for human sign-off.

## MSP ticket triage is already an execution-layer feature

**Source:** [ConnectWise, “Automated Ticket Triage for Smarter MSP Operations”](https://www.connectwise.com/solutions/automated-ticket-triage).

ConnectWise positions its PSA and RMM suite as an AI execution layer that classifies, prioritizes, routes, remediates, and documents service tickets from historical context. It explicitly contrasts this with standalone ticket triage that only recommends actions.

**Implication:** MSP ticket triage is not a suitable initial wedge for a local-model company. The main system of record already owns the data, workflow, and automation hooks. The local-company-model idea must be anchored in a workflow that is not yet natively owned by the incumbent system and for which privacy or air-gapped operation is a purchasing requirement rather than a nice-to-have.

## Preliminary commercial judgement

The user’s core intuition is sound: companies will pay to turn private operational knowledge into controlled AI workflows, especially where cloud exposure, API spend, and auditability matter. The initial commercial model, however, must be reframed.

| Original framing | Better product framing |
|---|---|
| A micro LLM trained for every company | A repeatable private workflow appliance based on a tested open-weight model plus a company-specific knowledge and policy capsule |
| Buy once and never pay for other models | One-time setup/hardware plus recurring subscription for updates, monitoring, indexing, policy, support, and workflow improvements |
| A general agentic graph interface | One pre-built, auditable, high-frequency workflow with human approval gates |
| Every company as a target | One vertical where private deployment is a purchase trigger and the same workflow repeats across customers |

The key MRR risk is that a bespoke installation behaves like consulting: every deployment has unique data, hardware, permissions, and workflows. That can create high revenue but weak recurring software economics. The product should be mostly standardised before it is sold repeatedly.

### Candidate initial wedges

| Candidate wedge | Why a private local model matters | MRR potential | Main risk |
|---|---|---|---|
| Tender exclusion desk for specialist contractors | Bid documents, internal price books, and exclusions are commercially sensitive; an auditable exception review can run in a customer environment | $750–$2,000 per month plus setup | AI estimating is crowded; the workflow must focus on exclusions and sign-off, not generic takeoffs |
| Controlled SOP assistant for regulated manufacturers | Operating procedures, quality records, and deviation evidence need controlled retrieval and approval trails | $1,000+ per site per month | Sales and validation can be slow because quality owners need trust and accuracy |
| Private document workflow for accounting/advisory firms | Client documents are sensitive and repetitive document classification/extraction work is expensive | $300–$1,500 per month | Crowded practice-management and tax-automation ecosystem |

**Unresolved decision:** the correct first vertical depends more on the founder’s access to 10–20 potential design partners than on abstract market size. The next step is to pick one reachable group and test whether local/private deployment is a must-have rather than merely an appealing architectural choice.

## Reverse-agent differentiation: discovery, not construction

**Source:** [OpenAI, “Introducing AgentKit”](https://openai.com/index/introducing-agentkit/), 6 October 2025; product update 3 June 2026.

OpenAI describes Agent Builder as a visual canvas where developers compose and version multi-agent workflows, connect tools, configure guardrails, preview runs, and evaluate outputs. The product update states Agent Builder and Evals are being wound down after 30 November 2026 in favour of code-oriented Agents SDK workflows or natural-language Workspace Agents.

**Implication:** Current agent tools help a technical or operations user **build** a workflow after deciding what to build. The Operations Cartographer must own the preceding decision: it receives a company’s messy operational evidence, reconstructs a specific current-state workflow, quantifies a bottleneck, presents ranked interventions with reasons and projected measurement, and creates a bounded agent only after an accountable owner approves it. Its core value is operating diagnosis and controlled improvement—not drag-and-drop orchestration.

## Process-intelligence boundary

**Source:** [Celonis](https://www.celonis.com/), public enterprise AI positioning accessed 17 August 2026.

Celonis is positioned publicly as enterprise process intelligence. The homepage content could not be extracted from the browser session, so this should be treated as a category reference rather than support for detailed feature claims.

**Implication:** The Operations Cartographer must not attempt enterprise-wide process mining, a digital twin of every workflow, or generic organisational transformation. The narrow product boundary is a **Metric-to-Agent Loop** for one operational metric: ingest the relevant evidence, explain the observed bottleneck, propose a small intervention, receive owner approval, run a bounded agent, and report the measured change versus baseline.
