# GitHub Connection Status

## Verified access

An active GitHub personal access token was validated against GitHub’s authenticated user endpoint through a server-side test. The token is stored as a managed server-side secret and is not exposed in source code or browser requests.

## Existing App discovery

The token does not have permission to query the authenticated account’s installed GitHub Apps endpoint; GitHub returned HTTP 403 for that read-only endpoint. Therefore, no conclusion can be drawn about whether the account already has an installed or reusable GitHub App. The personal token is appropriate for verifying the account but cannot replace a GitHub App’s installation-token model.

## What live Sentinel monitoring still needs

| Requirement | Purpose | Current status |
|---|---|---|
| GitHub App ID and client credentials | Starts an installation flow and scopes app access to selected repositories | Needed |
| GitHub App private key | Signs app JWTs and requests short-lived installation tokens on the server | Needed |
| Webhook secret | Verifies incoming GitHub webhook signatures | Needed |
| Public webhook callback URL | Receives scoped installation, repository, and push events | Available after production deployment; configure during app registration |
| Permissions | Read-only repository metadata and contents; installation / repository events; optional issues write after review | Must be selected during app registration |

## Product implication

The MVP accurately keeps live installation unavailable while these inputs are missing. It provides a clearly labelled demo risk map in the meantime. This is intentional: it avoids implying that a personal token is an appropriate mechanism for a customer-facing multi-tenant repository connection.

## Next account action

Create or identify a GitHub App in the account’s developer settings, set the product’s production callback URL, grant the minimum permissions described above, and add the generated App ID, private key, client credentials, and webhook secret through the project’s secure settings. Once supplied, the server can activate the installation endpoint and webhook handler.
