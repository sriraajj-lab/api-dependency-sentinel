# API Dependency Sentinel — First Revenue Playbook

**Stage:** Design-partner validation  
**Commercial objective:** Convert a useful read-only Risk Map into a recurring monitoring subscription without promising outcomes that have not yet been demonstrated.

## 1. The Business Model in Plain Language

API Dependency Sentinel is a **recurring B2B SaaS subscription**. A customer pays a monthly fee because the external providers their product relies on keep changing. Sentinel repeatedly watches those provider sources, maps relevant changes to their chosen repository, and gives an engineering owner evidence to decide what to review.

The customer is not paying for an AI chatbot, a generic changelog, or a one-time repository scan. They are paying for a recurring engineering-risk workflow:

> **Official provider change → likely code impact → human-reviewed next action.**

| Commercial layer | Customer receives | Revenue logic |
|---|---|---|
| Free qualification | A short discovery conversation and a scoped read-only Risk Map discussion. | Proves the problem and earns access; it is not an indefinite free service. |
| Paid pilot | Continuous monitoring for a limited scope, with a defined review cadence and outcome measurement. | Tests whether useful evidence creates willingness to pay. |
| Monthly Team plan | Ongoing repository/provider monitoring and reviewer workflow. | Creates predictable MRR after the pilot proves value. |
| Business / Enterprise expansion | More repositories, workflow integrations, controls, languages, and support. | Raises account value after customers demonstrate sustained use. |

## 2. The First Paid Offer

The company should sell **one simple paid offer first**, not several complicated packages.

### Founding Design-Partner Monitoring Pilot

| Element | Offer |
|---|---|
| Name | **Founding Design-Partner Monitoring Pilot** |
| Ideal customer | A SaaS engineering team with a TypeScript/Node repository and meaningful Stripe, OpenAI, or Twilio usage. |
| Scope | One repository, up to three currently supported providers, read-only GitHub connection, six-hour monitoring, reviewer workspace, and a monthly evidence review. |
| What Sentinel does | Collects official source revisions, identifies deterministic code evidence where available, and prepares human-review findings. |
| What Sentinel does *not* do | Write code, merge pull requests, guarantee outage prevention, or promise a fixed number of findings. |
| Pilot duration | 30 days after repository connection. |
| Founder price | **$149 for the first month**, then $149/month if the customer continues. |
| Cancellation | Cancel before the next monthly renewal; access stops at the end of the paid period. |
| Founder commitment | One onboarding session, one mid-pilot review, and one end-of-pilot decision discussion. |
| Customer commitment | Connect one repository, identify an engineering reviewer, give feedback on surfaced findings, and share whether the workflow would be worth recurring payment. |

The $149 price is a **learning price**, not a claim that the final product is worth only $149. Its purpose is to eliminate budget friction while proving that teams will exchange money for recurring evidence rather than merely agree that the idea is interesting.

## 3. Exactly How to Monetize Now

The next goal is not a large self-serve launch. It is **one paid pilot**. The first dollar validates more than a thousand page views.

| Step | Founder action | Customer decision | Exit condition |
|---:|---|---|---|
| 1 | Send the individually approved design-partner message. | Accept or decline a 20-minute discovery conversation. | A qualified conversation occurs. |
| 2 | Ask about a recent provider change, manual repo search, regression, or ownership gap. | Confirm whether the problem is recurring and worth solving. | Customer identifies a real workflow pain. |
| 3 | Demonstrate the live product: read-only GitHub connection, evidence model, and reviewer workspace. | Decide whether a scoped repository trial is safe and relevant. | Repository connection or a clear security follow-up. |
| 4 | Deliver a Risk Map discussion and describe exactly what a real finding would contain. | Decide whether continuous monitoring would save review effort. | Customer agrees the outcome would be valuable. |
| 5 | Offer the 30-day paid pilot at $149. | Approve payment and pilot start. | Payment received and repository connected. |
| 6 | Run the pilot, review outcomes, and collect accepted/rejected feedback. | Decide to continue, expand, or cancel. | Convert to recurring monitoring or record the reason not to. |

### Do Not Give Away the Ongoing Product

The free element is a conversation and a **scoped evaluation**, not unlimited monitoring. If a prospect says they like the concept but will not pay after a useful Risk Map, capture the objection. Possible causes include insufficient urgency, unclear accuracy, security friction, no owner, or the wrong pricing boundary. Do not respond by making the product free forever.

## 4. Qualification: Who Can Become a Customer

Prioritize prospects that can become a paid pilot quickly. A strong prospect has a recurring integration-maintenance pain, a technical owner, permission to connect a repository read-only, and a decision path for a modest monthly tool purchase.

| Qualification question | Strong answer | Weak answer | Sales decision |
|---|---|---|---|
| Does the team rely on multiple external APIs in production? | “Yes, we maintain Stripe, OpenAI, Twilio, or similar integrations.” | “We use one stable API and rarely change it.” | Continue only with strong fit. |
| Can they name a recent maintenance event? | “We recently spent time tracking down a provider change or deprecation.” | “No example; it is only theoretically interesting.” | Problem must be concrete. |
| Is there a clear reviewer? | Engineering, platform, integrations, or reliability lead owns the work. | Nobody owns external dependencies. | Do not start a pilot without an owner. |
| Can they authorize read-only access? | Yes, for one scoped repository after security review. | No repository access at all. | Offer discovery only; do not force a product trial. |
| Is there a purchase path? | Team lead can approve $149/month or route a small vendor purchase. | No budget, no sponsor, no plan to act. | Keep as research, not pipeline. |

## 5. Discovery and Closing Script

The founder should spend most of the call learning. Do not lead with a product tour.

| Moment | Suggested wording | Why it works |
|---|---|---|
| Open | “I am not asking you to buy a changelog. I want to understand the last time an outside API change created engineering work that was hard to route.” | Starts with the customer’s workflow, not product features. |
| Pain discovery | “How did you find the code, who owned the review, and what was slow or uncertain?” | Reveals manual work and ownership gaps. |
| Value test | “If an official change came with likely code evidence and a reviewer starting point, would that have changed the process?” | Tests the core promise without claiming certainty. |
| Security positioning | “The first version is read-only. It does not modify repository code; your team decides whether any action is taken.” | Reduces the most predictable trust objection. |
| Pilot close | “If we scope this to one repository and three providers for 30 days, would $149 be a reasonable way to test whether continuous evidence saves your team recurring review work?” | Tests real willingness to pay. |
| End-of-pilot close | “You saw the evidence and the review workflow. Is this useful enough to continue at $149/month, expand the scope, or should we stop? What would need to change?” | Gets a clear commercial answer. |

## 6. Pricing Tests After the First Pilots

Do not discount blindly. Test price only after the customer understands the value boundary.

| Test | Audience | Offer | Learning objective |
|---|---|---|---|
| Test A | First three qualified design partners | $149/month, one repository, three providers. | Does any team pay for continuous monitoring? |
| Test B | Next qualified group after accepted-finding evidence | $249/month, one repository, three providers, monthly review. | Is $149 artificially low for the perceived value? |
| Test C | Multi-repository or security-conscious buyer | Quote after discovery; include scope, review needs, and procurement effort. | Identify enterprise willingness to pay and required controls. |

Do not announce public annual pricing until several buyers have described their expected scope, security requirements, and budget process. The next commercial product decision should come from customer evidence, not competitors’ price pages.

## 7. Payment and Contracting Path

Payment infrastructure is not yet enabled inside the product. Until it is, the fastest honest path is a simple founder-led invoice or payment link after the customer approves the pilot scope. Do not collect payment data in chat or store it in the application without a payment integration.

| Stage | Minimum artifact |
|---|---|
| Pilot confirmation | One-page email or order form with customer name, one-repository scope, providers, read-only access, $149 fee, 30-day term, cancellation date, and no-code-write boundary. |
| Payment | A secure invoice or payment link issued through the founder’s chosen payment provider. |
| Onboarding | GitHub App connection, designated reviewer, and a 30-minute kickoff. |
| Review | Mid-pilot evidence review and end-of-pilot renewal decision. |

The company should add an in-product payment system only once a customer has agreed to pay and the founder confirms the desired legal entity, tax setup, payment provider, and refund/cancellation policy. A payment integration should not be built merely because it seems like a standard SaaS feature.

## 8. First 30 Days: Revenue Targets and Weekly Cadence

The target is **commercial learning**, not an artificial revenue number. A reasonable 30-day objective is one paid pilot, three qualified discovery calls, and a documented reason for every no.

| Week | Activity | Numerical target | Output |
|---|---|---:|---|
| 1 | Complete approved outreach and record submissions. | 5 messages; 1–2 replies. | Outreach log and follow-up dates. |
| 2 | Run discovery calls and demonstrate the workflow. | 3 qualified calls. | Problem statements, security objections, buyer titles, budget signals. |
| 3 | Offer the $149 pilot to strong fits. | 1–2 explicit paid-pilot asks. | Yes/no/maybe reasons and follow-up plan. |
| 4 | Start a paid pilot or revise qualification/message based on evidence. | 1 paid pilot or a precise documented objection pattern. | Revenue receipt or a justified experiment change. |

## 9. What to Measure Every Week

| Metric | Definition | Why it matters |
|---|---|---|
| Approved messages sent | Count of individually approved, actually submitted outreach messages. | Measures founder activity without confusing draft volume with outreach. |
| Positive replies | Replies that agree to a conversation or request more information. | Tests message-market fit. |
| Qualified calls | Calls with a technical owner, concrete pain, and relevant integration surface. | Tests customer quality. |
| Repository connections | Read-only repositories connected by qualified prospects. | Tests trust and onboarding friction. |
| Accepted findings | Findings a reviewer calls useful or acts upon. | Measures product value. |
| Pilot offers | Explicit $149 30-day offers made. | Measures whether sales conversations reach a commercial ask. |
| Paid pilots | Payments received for a defined monitoring scope. | First true revenue metric. |
| Renewal rate | Paid pilots continuing after the first 30 days. | Determines whether the subscription model is real. |

## 10. The Rule That Protects the Business

Do not sell a promise that Sentinel has already prevented outages, automatically found every issue, or generated revenue that has not been collected. Sell the truth: it is a read-only evidence system built to reduce the manual work of turning an external API change into a reviewable engineering decision. Then collect customer evidence to make the promise stronger.

**The next commercial milestone is simple: one paid, 30-day, $149 pilot with a technical owner, a connected repository, and a documented renewal decision.**
