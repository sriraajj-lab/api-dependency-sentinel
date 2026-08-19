# API Dependency Sentinel — Investor One-Pager

## The company

**API Dependency Sentinel** is building a read-only developer-reliability workflow for teams that depend on external APIs. It monitors provider evidence, maps material changes to likely consuming code, and prepares an auditable reviewer packet before an integration issue becomes an incident.

## The problem

Provider changelogs tell engineering teams that something changed. They rarely tell the team whether its repository uses the changed surface, where that use lives, who should review it, or how reliable the inference is. Stripe states that major API upgrades can require code updates and can affect API requests, responses, and webhook behavior.[1]

## The product

Sentinel starts with Stripe, OpenAI, and Twilio. A user connects an approved GitHub repository through a GitHub-first, read-only flow. Sentinel records provider poll state, scans TypeScript evidence, and runs a full analysis that persists a reviewer finding only when an immutable provider revision yields a deterministic code match. The product exposes the evidence path rather than silently making a change.

## Live validation

| Capability | Current validated state |
|---|---|
| Provider monitoring | Stripe, OpenAI, and Twilio scheduled polling with durable cursors and bounded audit records |
| Repository security | GitHub-first user approval with no repository write permission |
| Code evidence | TypeScript dependency, import, client, and SDK-call extraction |
| Workflow | Authenticated status card and one-click full analysis |
| Integration test | 4 files, 3 provider dependencies, and 10 code-evidence items recorded in an isolated authorized repository |

## Commercial hypothesis

The first segment is mid-market SaaS companies with multiple production integrations. The design-partner offer is one read-only repository Risk Map, followed by continuous monitoring at **$149/month** if the evidence proves useful. That equals **$1,788 of annualized list-price revenue per retained customer**; it is a pricing hypothesis, not booked ARR.[2]

## Why now

Provider evidence is increasingly machine-readable: Stripe publishes GA OpenAPI specifications and upgrade guidance, while OpenAI maintains a dated API changelog. [1] [3] [4] In parallel, GitHub describes AI, agents, and typed languages as major developer-workflow shifts.[5] Sentinel’s wager is that integration complexity creates a market for an evidence-first change-review control point.

## What we need to prove

The next commercial milestones are ten qualified conversations, three repository Risk Maps, three paid pilots or an equivalent measured willingness-to-pay outcome, and repeat use after more than one provider change. The company should be funded based on activation, pilot conversion, and retention—not unverified top-down market size claims.

## References

[1]: https://docs.stripe.com/upgrades "Stripe API upgrades"
[2]: Internal calculation: $149 × 12 months = $1,788 annualized list-price revenue per retained customer.
[3]: https://github.com/stripe/openapi "Stripe OpenAPI Specification"
[4]: https://developers.openai.com/api/docs/changelog "OpenAI API Changelog"
[5]: https://octoverse.github.com/ "GitHub Octoverse 2025"
