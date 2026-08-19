# GitHub Repository Onboarding Trust Boundary

The GitHub App setup URL is used only to return a user to Sentinel after installation. GitHub includes an `installation_id` query parameter on that redirect, but the parameter is not trusted as proof of ownership because it can be spoofed.

Repository connection uses a GitHub-first user-to-server authorization session. A short-lived, HTTP-only, state-bound browser cookie protects the authorization callback. The server verifies the GitHub identity, creates a local Sentinel session only after that verification, confirms the user can see an installation through GitHub's user-installation API, obtains a short-lived installation token only for that installation, enumerates repositories that token can read, and persists only the user-selected repository metadata. User and installation tokens are never sent to the browser or stored in the Sentinel database.

The onboarding flow remains read-only. A connection records the repository owner, name, GitHub repository identifier, default branch, and installation identifier; it does not write to the customer repository.

## Live authorization validation note

The production `/connect/github` route, its callback-state guard, protected candidate-list procedure, and repository-selection mutation have automated-test and production-build coverage. During initial manual validation, the external Manus application-authorization page at `manus.im/app-auth` rendered as a blank white page in the available browser surface. The onboarding flow now bypasses that unavailable portal and begins with GitHub authorization directly; no repository data is exposed or altered before the explicit repository-selection step.

The remaining live test begins at `https://venturesig-e4ipjaps.manus.space/connect/github`: select **Continue with GitHub**, authorize the GitHub App, and choose only `sriraajj-lab/api-dependency-sentinel-test`. Do not bypass the browser step with copied session cookies, bearer tokens, or a direct repository mutation.

## Completed production validation

The GitHub-first flow was completed in production using the existing GitHub App installation. It returned only `sriraajj-lab/api-dependency-sentinel-test`, recorded an explicit read-only repository connection for the verified GitHub identity, and reached the authenticated reviewer workspace. The production callback origin was also verified to use the registered public Sentinel domain rather than the internal deployment host.
