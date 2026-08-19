# API Dependency Sentinel — 5-Minute Investor Demo Script

**Audience:** Pre-seed investor, accelerator reviewer, or technical design partner.  
**Live product:** https://venturesig-e4ipjaps.manus.space  
**Demo repository:** `sriraajj-lab/api-dependency-sentinel-test` — isolated, synthetic, and explicitly authorized for read-only testing.

## Demo objective

Show that Sentinel converts a provider-change problem into a reviewable engineering workflow without receiving write access to a customer repository. Do not claim that the demo proves customer demand, production incident reduction, or universal language coverage.

## Run of show

| Time | Screen and action | Narration | Evidence shown |
|---:|---|---|---|
| 0:00–0:30 | Landing page | “External API change is easy to observe and difficult to operationalize. Sentinel is built for the handoff from a provider revision to the likely consuming code and reviewer.” | Value proposition and read-only posture |
| 0:30–1:15 | `/connect/github` | “A team authorizes GitHub directly. The first release asks only for repository contents read access and lets the user choose the repository.” | GitHub-first onboarding and owner selection |
| 1:15–2:00 | Authenticated reviewer workspace | “The status card shows the connected repository, last scan, and the latest Stripe, OpenAI, and Twilio polling state. This makes the system’s freshness inspectable rather than implicit.” | Repository status and provider poll timestamps |
| 2:00–2:45 | Click **Run full analysis** | “This is a read-only scan. Sentinel inventories dependencies and extracts TypeScript imports, client construction, and direct SDK-call evidence. It never writes to the repository.” | Pending state and read-only action |
| 2:45–3:30 | Scan completion | “The isolated repository produces 4 scanned files, 3 provider dependencies, and 10 code-evidence items. Sentinel reconciles that evidence with provider polling state.” | Success state and refreshed last-scan timestamp |
| 3:30–4:30 | Explain finding threshold | “A finding is persisted only if an immutable provider revision produces a deterministic match against code evidence. If no such match exists, the product preserves the empty state rather than inventing a risk.” | Provenance-first trust boundary |
| 4:30–5:00 | Close | “We begin with one repository, three providers, and a $149/month design-partner hypothesis. The next proof is paid, repeat usage after multiple real provider changes.” | Commercial experiment and honest milestone |

## Anticipated investor questions

| Question | Suggested answer |
|---|---|
| Why not use an LLM or code search? | “They can help investigate, but Sentinel’s core product is the evidence chain: authoritative provider source, immutable revision, code location, matcher version, confidence reasons, and human review. An LLM can be an assist layer, not the trust boundary.” |
| Why not build this in-house? | “A company can, but it must maintain provider adapters, source-cursor correctness, GitHub security, parser coverage, provenance, and feedback loops across providers. The early product earns the right to exist only if it removes enough repeated maintenance work.” |
| What is actually proprietary? | “Nothing is claimed as proprietary today. The defensibility hypothesis is accumulated provider normalization, verified source-to-code mappings, ownership signals, and reviewer feedback across real provider changes.” |
| What must be true for this to work? | “Teams must encounter recurring integration-maintenance work and value a trustworthy evidence packet enough to connect a repository and pay. Paid pilot conversion and repeat use are the next falsifiable tests.” |

## Demo preparation checklist

1. Verify the latest provider poll timestamps are visible in the reviewer workspace.
2. Use only the isolated test repository; never demonstrate with a customer repository without written permission.
3. Begin from a signed-in reviewer workspace so the connection flow is not the focus unless requested.
4. If no current source-backed match exists, state that plainly and show the no-fabrication behavior.
5. End with the design-partner ask: one repository, one integration maintenance incident or near miss, and a decision about continuous monitoring.
