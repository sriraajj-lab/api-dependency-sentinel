# API Dependency Sentinel — MVP Architecture

## Product boundary

API Dependency Sentinel is a GitHub-first, read-only integration-risk product. It identifies supported external API dependencies inside a connected repository, compares monitored upstream sources with a stored baseline, maps meaningful changes to likely code locations, and creates reviewable remediation work. It will **not** autonomously change production code or write to a customer repository in the first release.

## Event model

The product should use an installed GitHub App rather than repository polling. GitHub documents that Apps may subscribe to specific webhook events, receive event payloads through a registered webhook URL, and act according to the content; webhook subscriptions are permission-dependent.[1]

| Event / input | MVP action | Human control |
|---|---|---|
| App installation and selected repositories | Create repository records; queue a baseline dependency scan | Customer scopes access to selected repositories |
| `push` event on default branch | Re-scan known integration points and refresh code references | Read-only scan; no repository writes |
| `installation_repositories` event | Add or remove repository monitoring | Customer controls the installation selection |
| Scheduled upstream-source check | Diff an approved provider’s changelog, OpenAPI source, and deprecation notices against the current baseline | Users select tracked providers and can mute a source |
| Confirmed upstream change | Search connected code, generate a risk finding, and open an internal review state | Customer selects Ignore, Create GitHub Issue, Draft test plan, or later Draft PR |

## Supported provider boundary

Version one supports six providers only: Stripe, Shopify, Twilio, Slack, HubSpot, and Meta. A provider is supported only when the product has a stable official source to diff and a credible code-pattern map for known client/SDK usage. The app will display data-confidence labels rather than pretend every code reference is certain.

## Risk score

`risk = change_severity × code_reference_confidence × execution_surface × deadline_urgency`

The initial UI explains every component of the score and links to source evidence. A low-confidence finding remains a suggestion, not a claim that an integration will fail.

## Deployment and security shape

The public product needs a backend for user accounts, repository findings, installation metadata, provider baselines, and webhook-signature validation. The eventual GitHub App private key, client ID, and webhook secret must be stored server-side as managed secrets; they must never be committed or sent to the browser. The initial dashboard can be fully usable with seeded/demo repository data while GitHub App credential configuration is pending.

## Delivery modes considered

| Product implementation route | Tradeoffs | Cost | Setup complexity |
|---|---|---:|---|
| Interactive demo and manual repository scan | Fastest way to validate UX and paid demand; no live GitHub installation or automatic monitoring | Lowest | Low |
| Full GitHub App with event-driven scans and scheduled upstream checks | Delivers the intended product value; requires backend storage, a registered GitHub App, server-side secrets, and a public webhook endpoint | Managed platform usage after free start | Medium |

The build will start with the second product shape but expose a polished demo path so early visitors can evaluate the risk-map experience before GitHub App credentials are configured.

## References

[1]: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps "GitHub Docs — Using webhooks with GitHub Apps"
