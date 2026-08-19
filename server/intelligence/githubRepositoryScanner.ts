import { createPrivateKey } from "node:crypto";
import { importPKCS8, SignJWT } from "jose";
import { extractRepositoryEvidence } from "./typescriptEvidence";

const GITHUB_API = "https://api.github.com";
const MAX_FILES = 80;
const MAX_FILE_BYTES = 150_000;
const MAX_TOTAL_BYTES = 1_500_000;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type GitHubInstallation = { id: number; account?: { login?: string } };
type GitHubRepository = { full_name: string };
type RepositoryMetadata = { id: number; full_name: string; default_branch: string; owner?: { login?: string }; name?: string };
type GitReference = { object: { sha: string } };
type TreeEntry = { path: string; type: "blob" | "tree"; sha: string; size?: number };
type GitTree = { tree: TreeEntry[]; truncated?: boolean };
type GitBlob = { content: string; encoding: string; size: number };

export type GitHubRepositoryScan = {
  repositoryFullName: string;
  commitSha: string;
  defaultBranch: string;
  fileCount: number;
  totalBytes: number;
  evidence: ReturnType<typeof extractRepositoryEvidence>;
};

export type GitHubConnectCandidate = {
  installationId: string;
  githubRepositoryId: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
};

export type GitHubAuthenticatedUser = {
  id: number;
  login: string;
  name?: string | null;
  email?: string | null;
};

function normalizePem(rawPem: string) {
  return rawPem.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
}

export async function createGitHubAppJwt(appId: string, privateKey: string): Promise<string> {
  const keyObject = createPrivateKey(normalizePem(privateKey));
  const pkcs8 = keyObject.export({ format: "pem", type: "pkcs8" }).toString();
  const signingKey = await importPKCS8(pkcs8, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: appId })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt(now - 30)
    .setExpirationTime(now + 8 * 60)
    .sign(signingKey);
}

async function githubJson<T>(url: string, token: string, fetchImpl: FetchLike, method = "GET"): Promise<T> {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "api-dependency-sentinel/1.0",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`GitHub API request failed with HTTP ${response.status}: ${detail}`);
  }
  return (await response.json()) as T;
}

function isCandidatePath(path: string) {
  const filename = path.split("/").at(-1) ?? "";
  if (filename === "package.json" || filename === "package-lock.json") return true;
  if (/\.(?:[cm]?[jt]sx?)$/.test(filename)) return true;
  return false;
}

function decodeBase64(content: string) {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}

async function findInstallationToken(repositoryFullName: string, appJwt: string, fetchImpl: FetchLike) {
  const installations = await githubJson<GitHubInstallation[]>(`${GITHUB_API}/app/installations`, appJwt, fetchImpl);
  for (const installation of installations) {
    const tokenPayload = await githubJson<{ token: string }>(`${GITHUB_API}/app/installations/${installation.id}/access_tokens`, appJwt, fetchImpl, "POST");
    const access = await githubJson<{ repositories: GitHubRepository[] }>(`${GITHUB_API}/installation/repositories`, tokenPayload.token, fetchImpl);
    if (access.repositories.some(repository => repository.full_name === repositoryFullName)) return tokenPayload.token;
  }
  throw new Error(`The GitHub App is not installed for ${repositoryFullName}.`);
}

export async function exchangeGitHubUserCode(input: { code: string; redirectUri: string; clientId?: string; clientSecret?: string; fetchImpl?: FetchLike }) {
  const clientId = input.clientId ?? process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = input.clientSecret ?? process.env.GITHUB_APP_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("GitHub App OAuth client credentials must be configured server-side.");
  const response = await (input.fetchImpl ?? fetch)("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", "User-Agent": "api-dependency-sentinel/1.0" },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code: input.code, redirect_uri: input.redirectUri }),
  });
  if (!response.ok) throw new Error(`GitHub user authorization exchange failed with HTTP ${response.status}.`);
  const payload = (await response.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!payload.access_token) throw new Error(`GitHub user authorization exchange failed: ${payload.error_description ?? payload.error ?? "missing access token"}`);
  return payload.access_token;
}

export async function getGitHubAuthenticatedUser(input: { userAccessToken: string; fetchImpl?: FetchLike }): Promise<GitHubAuthenticatedUser> {
  return githubJson<GitHubAuthenticatedUser>(`${GITHUB_API}/user`, input.userAccessToken, input.fetchImpl ?? fetch);
}

export async function listGitHubConnectCandidates(input: { userAccessToken: string; appId?: string; privateKey?: string; fetchImpl?: FetchLike }): Promise<GitHubConnectCandidate[]> {
  const appId = input.appId ?? process.env.GITHUB_APP_ID;
  const privateKey = input.privateKey ?? process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) throw new Error("GitHub App ID and private key must be configured server-side.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const appJwt = await createGitHubAppJwt(appId, privateKey);
  const userInstallations = await githubJson<{ installations: GitHubInstallation[] }>(`${GITHUB_API}/user/installations?per_page=100`, input.userAccessToken, fetchImpl);
  const candidates: GitHubConnectCandidate[] = [];
  for (const installation of userInstallations.installations) {
    const tokenPayload = await githubJson<{ token: string }>(`${GITHUB_API}/app/installations/${installation.id}/access_tokens`, appJwt, fetchImpl, "POST");
    const access = await githubJson<{ repositories: GitHubRepository[] }>(`${GITHUB_API}/installation/repositories?per_page=100`, tokenPayload.token, fetchImpl);
    for (const repository of access.repositories) {
      const metadata = await githubJson<RepositoryMetadata>(`${GITHUB_API}/repos/${repository.full_name}`, tokenPayload.token, fetchImpl);
      const [owner, name] = metadata.full_name.split("/");
      if (!owner || !name) continue;
      candidates.push({ installationId: String(installation.id), githubRepositoryId: String(metadata.id), owner: metadata.owner?.login ?? owner, name: metadata.name ?? name, fullName: metadata.full_name, defaultBranch: metadata.default_branch });
    }
  }
  return candidates.sort((left, right) => left.fullName.localeCompare(right.fullName));
}

export async function scanInstalledTypeScriptRepository(input: {
  repositoryFullName: string;
  appId?: string;
  privateKey?: string;
  fetchImpl?: FetchLike;
}): Promise<GitHubRepositoryScan> {
  const appId = input.appId ?? process.env.GITHUB_APP_ID;
  const privateKey = input.privateKey ?? process.env.GITHUB_APP_PRIVATE_KEY;
  if (!appId || !privateKey) throw new Error("GitHub App ID and private key must be configured server-side.");
  if (!/^[^/]+\/[^/]+$/.test(input.repositoryFullName)) throw new Error("Repository full name must be in owner/name form.");
  const fetchImpl = input.fetchImpl ?? fetch;
  const appJwt = await createGitHubAppJwt(appId, privateKey);
  const installationToken = await findInstallationToken(input.repositoryFullName, appJwt, fetchImpl);
  const metadata = await githubJson<RepositoryMetadata>(`${GITHUB_API}/repos/${input.repositoryFullName}`, installationToken, fetchImpl);
  const ref = await githubJson<GitReference>(`${GITHUB_API}/repos/${input.repositoryFullName}/git/ref/heads/${encodeURIComponent(metadata.default_branch)}`, installationToken, fetchImpl);
  const tree = await githubJson<GitTree>(`${GITHUB_API}/repos/${input.repositoryFullName}/git/trees/${ref.object.sha}?recursive=1`, installationToken, fetchImpl);
  if (tree.truncated) throw new Error("Repository tree exceeded GitHub's recursive listing limit.");

  const candidates = tree.tree
    .filter(entry => entry.type === "blob" && isCandidatePath(entry.path) && (entry.size ?? 0) <= MAX_FILE_BYTES)
    .slice(0, MAX_FILES);
  const files: Array<{ path: string; content: string }> = [];
  let totalBytes = 0;
  for (const entry of candidates) {
    if (totalBytes + (entry.size ?? 0) > MAX_TOTAL_BYTES) break;
    const blob = await githubJson<GitBlob>(`${GITHUB_API}/repos/${input.repositoryFullName}/git/blobs/${entry.sha}`, installationToken, fetchImpl);
    if (blob.encoding !== "base64" || blob.size > MAX_FILE_BYTES) continue;
    const content = decodeBase64(blob.content);
    totalBytes += Buffer.byteLength(content, "utf8");
    files.push({ path: entry.path, content });
  }

  const evidence = extractRepositoryEvidence({
    repositoryFullName: metadata.full_name,
    commitSha: ref.object.sha,
    defaultBranch: metadata.default_branch,
    files,
  });
  return { repositoryFullName: metadata.full_name, commitSha: ref.object.sha, defaultBranch: metadata.default_branch, fileCount: files.length, totalBytes, evidence };
}
