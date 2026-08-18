# GitHub Repository Onboarding Trust Boundary

The GitHub App setup URL is used only to return a user to Sentinel after installation. GitHub includes an `installation_id` query parameter on that redirect, but the parameter is not trusted as proof of ownership because it can be spoofed.

Repository connection therefore requires a GitHub App user-to-server authorization session. The server verifies the authenticated GitHub user can see the installation through GitHub's user-installation API, obtains a short-lived installation token only for that installation, enumerates repositories that token can read, and persists only the user-selected repository metadata. User and installation tokens are never sent to the browser or stored in the Sentinel database.

The onboarding flow remains read-only. A connection records the repository owner, name, GitHub repository identifier, default branch, and installation identifier; it does not write to the customer repository.
