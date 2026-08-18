# GitHub App Configuration — API Dependency Sentinel

## Identity

| Field | Value |
|---|---|
| App name | API Dependency Sentinel |
| App ID | 4627952 |
| Description | Detect upstream API changes, map likely impact in connected repositories, and prepare source-backed remediation work for owner review. |
| Homepage | https://venturesig-e4ipjaps.manus.space |

## Minimum-permission policy

The first release is read-only by default. It needs to inspect selected repositories and receive installation/repository/push events. It must not gain administration, secrets, deployments, or production-write access.

| GitHub App area | Initial configuration |
|---|---|
| User authorization and device flow | Disabled; Sentinel does not need a user access token for its read-only repository scan. |
| Redirect URI | Omitted in the first release; no OAuth callback is needed until a separate user-identity flow is introduced. |
| Setup URL | Omitted until the published production URL is available. |
| Webhook | Temporarily disabled because a published, signature-verifying endpoint is not yet configured. |
| Repository metadata | Read-only, to enumerate selected repositories and their default branches. |
| Repository contents | Read-only, to locate supported API clients, endpoint strings, SDK imports, and webhook handlers. |
| Issues | No access in the first registration; enable write only after the live “create reviewed issue” product action is implemented and tested. |
| All other repository, organization, and account permissions | No access. |

## Event subscriptions for later activation

When the public webhook is configured and verified, subscribe only to installation, installation repository changes, and push events. These events are sufficient to connect selected repositories and refresh code references without broad polling.

## Credential boundary

The App ID, client ID, client secret, and private key have been created and stored exclusively as managed server-side secrets. The client credential contract and App-JWT authentication were each validated directly with GitHub. No credential value appears in project files or browser code.

## Current configuration state

The product is published at **https://venturesig-e4ipjaps.manus.space**. The GitHub App’s homepage has been updated from the temporary preview to this canonical production URL. Repository Contents is configured as **Read-only** and Metadata remains GitHub’s mandatory baseline. All other optional repository, organization, and account permissions remain at **No access**.

The GitHub App webhook is configured with the HTTPS endpoint `https://venturesig-e4ipjaps.manus.space/api/github/webhook`, a managed high-entropy secret, and SSL certificate verification enabled. The production server handler verifies `X-Hub-Signature-256` before accepting an event; it must be deployed before event subscriptions are enabled. The product does not write to customer repositories or create GitHub issues.

## Production activation prerequisites

Before enabling live installations, deploy and verify the signed webhook callback, subscribe only to installation, installation-repositories, and push events, and install the App on a dedicated test repository. Keep Issues at No access until an explicit reviewed-issue action has been implemented and approved.

The registration review specifically verified that Repository Contents—not an adjacent Copilot setting—was set to Read-only before creation.
