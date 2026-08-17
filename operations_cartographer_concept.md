# Workprint: The AI Operations Cartographer

## The premise, sharpened

>The company should not have to design an agent. It should show the system how work, performance, constraints, and goals actually fit together. The system should then recommend the smallest useful agent, explain why it exists, and run it only with accountable approval.

**Workprint** is an AI Operations Cartographer. It ingests a company’s messy operational evidence—documents, metrics, tools, recurring blockers, goals, exceptions, and stated constraints—and produces a current-state operating map. It then identifies the metric with the clearest improvement opportunity, presents a source-backed diagnosis, recommends a specific intervention, and deploys one bounded agent only after a human owner approves the plan.

The product is not a chatbot, agent marketplace, drag-and-drop automation canvas, or a general promise to “optimise your company.” It is a **Metric-to-Agent Loop**:

| Stage | What the customer provides | What Workprint does | Required human control |
|---|---|---|---|
| 1. Frame | One business metric, goals, constraints, and a short list of systems or exported data | Creates a data map and identifies missing/low-confidence evidence | Owner confirms the metric and data-access boundaries |
| 2. Diagnose | Work artifacts: requests, documents, time, outcomes, hand-offs, and known blockers | Builds a current-state map, quantifies gaps, cites evidence, and ranks intervention candidates | Owner reviews evidence and rejects incorrect assumptions |
| 3. Propose | Approval policy, users, and allowed tools | Creates a plain-language agent blueprint: objective, inputs, tools, boundaries, expected metric, and rollback conditions | Named owner approves the blueprint and access |
| 4. Run | Read/write permissions for only the approved tool actions | Runs a bounded agent with escalation paths and an audit trail | Human reviews exceptions and can pause or revoke the agent |
| 5. Learn | Measured outcome and human feedback | Compares performance with the baseline and recommends keep, revise, or retire | Owner accepts the next iteration |

## The important correction: do not ask the AI to “decide its functionality” alone

The AI can discover patterns and **recommend** a function. It should never unilaterally decide which systems to access, which commercial commitments to make, which approvals to bypass, or which operational policy to change. Those are management decisions.

The product should instead make agent proposals feel like an operating memo:

> **Observed gap:** Client-delivery requests are accepted before scope and capacity are verified.  
> **Evidence:** 18 requests in the past month were delivered without a linked SOW clause, and the affected accounts ran below the target margin.  
> **Proposed agent:** Scope Sentinel watches selected incoming requests, matches them against the approved scope, and prepares an owner-reviewed change response for likely exceptions.  
> **Expected measurement:** Reduce unpriced request volume and improve project gross margin.  
> **Boundary:** The agent may draft and classify; it may not send client communications or change invoices without owner approval.

This approach produces explainability, trust, and a clear audit path. It is also where the product is genuinely different from a workflow builder.

## Why the horizontal version is not the first product

Horizontal platforms already cover most of the raw capability. Progress offers central ingestion, hybrid retrieval, configurable chunking and metadata, model choice, continuous updates, source citations, and evaluation for agentic enterprise knowledge layers.[1] IBM frames locally hosted models as one governed option behind a model gateway with policies, secrets, access controls, audit records, authentication, and tenant isolation.[2] NVIDIA describes private inference as an operational stack involving model formats, quantization, backend selection, optimization, and a running inference server—not merely downloading a model.[3]

Agent-building tools also already help users compose multi-step logic. OpenAI’s AgentKit described a visual canvas for composing workflows, tools, guardrails, versioning, preview, and evaluation; its June 2026 update says the Agent Builder and Evals products will be wound down after November 2026 in favour of code-oriented or natural-language alternatives.[4]

Therefore, the wedge cannot be “build your own private agent.” The wedge is **diagnose the one operational metric that is underperforming, explain why, and generate the most constrained agent that can improve it.**

## Recommended first wedge: Workprint for 10–25 person client-service agencies

The first vertical should be client-service agencies with recurring revenue: Webflow, design, paid-media, product-development, and marketing agencies. This is intentionally narrower than “every company.” These teams have accessible, mostly text-based evidence and metrics, a founder or delivery lead who can buy quickly, recurring operational pain, and no requirement to replace the existing stack.

### The metric

**Protect delivery margin on retained and fixed-fee client work.**

The customer provides a short, bounded data pack: signed SOWs or retainer terms, a client roster, project/task exports, time exports, invoices, a small set of client requests, and the desired gross-margin or utilisation target. In a mature product, these are connected through read-only integrations. In the pilot, simple exports and user-forwarded messages are sufficient.

### The first diagnosis

Workprint creates an **Agency Performance Map** that connects scope, requests, work allocation, time, invoice status, and project outcomes. It flags patterns such as unpriced requests, approval delays, repeat rework loops, tasks started before a brief is complete, or capacity allocations that make target margin unattainable.

### The agent portfolio it proposes

| Proposed agent | Trigger | Bound action | Metric it is designed to improve |
|---|---|---|---|
| Scope Sentinel | A client request arrives through a selected channel | Compares the request to the signed scope; drafts an approval or clarification note; never sends it automatically | Unpriced scope and gross margin |
| Brief Completeness Guard | A project is moved into delivery | Checks required inputs against the agency’s own checklist; creates a review item for gaps | Rework and cycle time |
| Capacity Guard | Planned work would exceed the target hours for a retainer or project | Flags the risk, shows the evidence, and prepares a decision memo for the delivery lead | Utilisation and delivery margin |

The key is that the agency does not ask, “How do I configure Scope Sentinel?” Workprint reaches the recommendation from the agency’s own performance map, then gives the owner a precise blueprint and the ability to approve, modify, reject, or defer it.

## The commercial model

The first sale should combine a paid diagnostic with a recurring operating product.

| Offer | What the customer buys | Indicative price hypothesis | Why it creates fast revenue proof |
|---|---|---:|---|
| Workprint Baseline | A one-week Agency Performance Map using exports, documents, and owner interviews | $1,000–$2,500 one time | A paid, concrete result before a software commitment |
| Workprint Monitor | The live metric view, evidence trail, and one approved agent | $499/month | The workflow continues to surface risk every week |
| Workprint Portfolio | Multiple agencies teams, three agents, monthly operating review | $1,250/month | The product expands as the customer trusts more bounded interventions |

These are hypotheses to test, not promised pricing. A customer who receives a credible diagnosis but will not pay a modest subscription to keep the monitor live is a warning that the issue is intellectually interesting rather than commercially urgent.

## The 30-day proof plan

| Period | Work | Pass condition |
|---|---|---|
| Days 1–5 | Speak to 15 agency founders and delivery leads. Ask for a recent project that missed margin, a SOW, a time export, and the actual request trail. | At least eight can point to a repeatable avoidable gap and will share limited anonymized exports. |
| Days 6–10 | Produce three manual Agency Performance Maps. Show the evidence, not generic consulting advice. | At least two buyers agree the map reveals something they did not see clearly in their existing tools. |
| Days 11–20 | Run Scope Sentinel manually: classify selected requests, cite the agreement, and draft owner-reviewed responses. | At least two agencies use the outputs during active client delivery. |
| Days 21–30 | Ask for payment: a paid Baseline or $499/month to continue one live agent. | At least two paid customers, with a clear repeated use case and an owner who keeps the agent enabled. |

The kill criterion is strict: if the product cannot surface a measurable, actionable gap from a small data pack in the first week, then it is too broad and too consulting-dependent. Narrow the metric or abandon the wedge rather than building a larger platform.

## Deployment and the role of the local micro-model

The local small model is **not** the first sell. It is an optional deployment mode for customers that need private processing or have enough repetitive volume to make model routing economical.

The initial architecture should be model-flexible: source data and policy remain customer-controlled; routine classification and extraction can use a smaller private model where appropriate; complex or low-confidence work is routed to a stronger model only after the customer approves that policy; every recommendation has source evidence and an audit record. This preserves the user’s original insight—agents should adapt to the company—but avoids the unsustainable promise that a one-time micro-model eliminates all ongoing AI cost.

## Strategic-acquisition logic

No startup is easy to acquire. The controllable objective is to create a differentiated capability with recurring revenue, retained customers, and a dataset that a system-of-record buyer could value.

If Workprint proves that its metric-to-agent loop reduces margin leakage for a defined agency cohort, strategic categories could include agency-management, PSA, time-and-billing, client-management, and project-management platforms. The eventual asset is not an agent canvas; it is the labelled operational dataset connecting a company’s goals, artifacts, bottlenecks, proposed agents, approved controls, and measured outcomes.

## Decision

**Keep ProofPass and ScopeLock as backups. Advance Workprint only as a paid diagnostic for one vertical, one metric, and one agent.** The company-wide vision is compelling, but its only credible path is to prove that the product can discover and improve a narrow operational loop before it tries to become a universal operating system.

## References

[1]: https://www.progress.com/agentic-rag "Progress — Agentic RAG Platform for AI Agents and LLMs"

[2]: https://www.ibm.com/new/announcements/ibm-watsonx-ai-v2-4-expanding-governed-ai-development-for-the-enterprise "IBM — watsonx.ai v2.4: Expanding Governed AI Development for the Enterprise"

[3]: https://developer.nvidia.com/blog/simplify-llm-deployment-and-ai-inference-with-unified-nvidia-nim-workflow/ "NVIDIA Technical Blog — Simplify LLM Deployment and AI Inference with a Unified NVIDIA NIM Workflow"

[4]: https://openai.com/index/introducing-agentkit/ "OpenAI — Introducing AgentKit"
