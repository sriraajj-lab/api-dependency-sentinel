# API Dependency Sentinel — Marketing and Sales Playbook

## Positioning

> **API Dependency Sentinel tells engineering teams which upstream API change matters to their code before an integration breaks.**

The product does not compete as an availability monitor, generic changelog reader, or broad AI coding agent. Its promise is a source-backed decision: an official provider change, the likely repository impact, the confidence of the match, the deadline, and a human-approved next step.

## Initial ideal customer profile

The first buyer is a CTO, platform lead, or staff engineer at a **10–75 person SaaS company** that relies on at least three third-party APIs and has one or more integrations with Stripe, Shopify, Twilio, Slack, HubSpot, or Meta. These teams feel the cost of integration regressions but can install a low-risk GitHub App without an enterprise procurement process.

| Qualification signal | Why it matters | Where to find it |
|---|---|---|
| The product advertises two or more supported integrations | It creates an external API dependency surface. | Product integration pages, developer docs, or public changelogs. |
| The company has a public GitHub organization or engineering hiring activity | It increases the chance that a GitHub-first motion fits. | GitHub, careers pages, and engineering blogs. |
| The team has recently shipped integration work or a new API connector | The change risk is immediate rather than hypothetical. | Release notes, job posts, product updates, and founder posts. |
| The company has fewer than 75 engineers | A founder or engineering leader can usually approve a low-cost tool quickly. | LinkedIn, team pages, and job listings. |

The first segment should be **B2B SaaS teams that serve merchants or operational teams and depend on Stripe plus one operational integration**. They are accessible online, their integration ownership is usually visible, and the first supported-provider package stays focused.

## The product-led funnel

The site’s free product is the **Integration Risk Map**. A visitor installs a read-only GitHub App, selects one repository, and receives a map of supported dependencies, observed code surface, source coverage, and confidence. The paid conversion occurs when the team wants continuous monitoring, owner routing, and a durable remediation queue.

| Funnel stage | Visitor question | Product answer | Primary metric |
|---|---|---|---|
| Awareness | “Why would I need this?” | A concrete story about an upstream deprecation reaching a production integration. | Qualified landing-page visits |
| Activation | “Does it understand my stack?” | A fast, read-only Risk Map that identifies a supported dependency and its code surface. | Connected repositories / activated maps |
| First value | “Would it have helped us?” | One verified provider change mapped to relevant code, with source evidence. | Findings opened and reviewed |
| Conversion | “Why pay monthly?” | Continuous monitoring, owner routing, history, and reviewed GitHub work. | Risk maps converted to paid monitors |
| Expansion | “Can it protect more services?” | More repositories, supported providers, and shared ownership. | Monitored APIs per account |

GitHub’s official Marketplace documentation confirms that an App listing can be drafted, described with listing images, offered as free or paid tiers, and later submitted for review; paid plans can be configured as distinct feature tiers.[1] Marketplace is therefore a credible channel after the live GitHub App has been activated, but it is **not** the first validation channel. First win design partners directly, learn which outcomes they value, and then turn those learnings into the Marketplace listing.

## Pricing hypothesis and MRR targets

The following are operating targets, not revenue forecasts. The point is to validate that the product can move from a free risk map to recurring monitoring without an expensive sales process.

| Stage | Customer mix hypothesis | Target MRR | Evidence needed to advance |
|---|---|---:|---|
| Days 1–30 | 3 design partners at $149/month | $447 | Each reacts to at least one useful source-to-code finding. |
| Days 31–60 | 10 Builder accounts at $39 plus 5 Team accounts at $149 | $1,135 | At least half of paying teams keep monitoring enabled after 30 days. |
| Days 61–90 | 20 Builder accounts plus 10 Team accounts | $2,270 | A repeatable activation path and at least one organic or Marketplace-originated lead. |

Keep plans simple: **Free Risk Map**, **Builder at $39/month**, and **Team at $149/month**. The early design-partner offer should be Team access at $149/month in exchange for scheduled feedback and permission to report anonymized product outcomes. Do not offer indefinite free pilots; a paid commitment is the necessary MRR signal.

## First marketing assets

| Asset | Purpose | First version |
|---|---|---|
| Landing page | Explain the product category and route developers into the Risk Map. | Built in the MVP. |
| Demo risk workspace | Show the evidence chain before a live GitHub App is configured. | Built in the MVP. |
| Risk Map sample report | Make the benefit shareable with an engineering manager or CTO. | Exportable one-page report after live connection. |
| Provider-maintenance guides | Capture high-intent developer search traffic. | Start with “Shopify API deprecation checklist” and “Stripe webhook change review checklist.” |
| GitHub Marketplace draft | Establish a trusted installation surface after design-partner proof. | Create only after the App and billing flow work. |
| Short technical teardown | Demonstrate judgment with a real, public provider change and safe mitigation steps. | Publish weekly, citing the official provider source. |

## Design-partner outreach

Start with 50 carefully selected companies, not a mass email list. Target companies that advertise one or more supported integrations and have visible engineering leadership. Do not claim the product has detected their specific risk before connecting their repository.

### First email

> **Subject:** A read-only way to catch upstream API changes before they hit production
>
> Hi {{first_name}},
>
> I’m building API Dependency Sentinel for teams that depend on external APIs such as Stripe, Shopify, Twilio, Slack, HubSpot, or Meta. It watches the provider’s official change sources, maps a meaningful update to likely code references, and prepares a reviewed issue or test plan before an integration breaks.
>
> We are looking for a small number of design partners. The pilot begins with a read-only GitHub Risk Map for one repository, then continuous monitoring at $149/month if it surfaces useful work. Would you be open to a 20-minute review of one integration incident or near miss from the past year?
>
> Best,
> {{founder_name}}

### Follow-up

> I’m not asking you to replace monitoring or observability. The narrow question is whether a provider’s documented change can be connected to *your* consuming code early enough to make a cheap, reviewed fix. If that is not a meaningful problem for your team, I will close the loop.

## Sales call structure

The call should test a real workflow rather than pitch abstract AI.

| Call segment | Question | What a positive answer sounds like |
|---|---|---|
| Incident recall | “Tell me about the last third-party API change that caused rework, an incident, or a scramble.” | The team can describe a concrete upstream change and the cost of discovering it late. |
| Current detection | “Where would you learn about the next one?” | Information is split across changelogs, team memory, vendor emails, and runtime symptoms. |
| Evidence acceptance | “Would you trust a finding that links official source, affected code, and a confidence score?” | The buyer values evidence and can name an owner who would review it. |
| Installation boundary | “Would you install a read-only GitHub App for one repository to see a Risk Map?” | The buyer can accept scoped repository access. |
| Paid test | “If it surfaced a useful change, would $149/month be reasonable to keep it watching?” | A paid pilot is accepted or the buyer gives a concrete pricing objection. |

## Investor and strategic story

The investor narrative is not “AI watches API changelogs.” It is **the dependency-intelligence layer for modern software**. Every customer adds a structured link between upstream changes, consuming code, human severity decisions, remediation work, and measured outcome. The data graph compounds by provider and programming ecosystem.

The strategic story is plausible—not guaranteed. The product can fit future portfolios of API platforms, developer portals, code-quality suites, application-security platforms, developer observability, and code-hosting ecosystems. The evidence an investor or strategic buyer needs is clear: self-serve repository activation, retained accounts after real incidents, high-quality source-to-code match precision, and efficient distribution through GitHub and provider-maintenance content.

## Operating cadence

| Weekly rhythm | Founder action | Success signal |
|---|---|---|
| Monday | Publish one source-backed provider-change teardown. | Qualified engineers visit the Risk Map. |
| Tuesday–Thursday | Send 10 personalized design-partner notes per day. | Three discovery calls per week. |
| Friday | Run a design-partner review and record false positives, missing sources, and desired actions. | A narrower, more trusted product boundary. |
| Every week | Review activation, first finding, paid conversion, retention, and false-positive rate. | Progress against the 30/60/90-day gates. |

## References

[1]: https://docs.github.com/en/apps/github-marketplace/listing-an-app-on-github-marketplace "GitHub Docs — Listing an app on GitHub Marketplace"
