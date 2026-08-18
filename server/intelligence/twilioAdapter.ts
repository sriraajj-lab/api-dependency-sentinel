import { createHash } from "node:crypto";
import type { ProviderChange, SourceSnapshot } from "../../shared/intelligence";

const TWILIO_OPENAPI_BASE = "https://raw.githubusercontent.com/twilio/twilio-oai";
const TWILIO_SPEC_PATH = "spec/json/twilio_api_v2010.json";
const TWILIO_COMMIT_URL = "https://api.github.com/repos/twilio/twilio-oai/commits/main";
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

type OpenApiDocument = { paths?: Record<string, Record<string, { operationId?: string }>> };

export type TwilioSourceCursor = {
  etag?: string | null;
  commitSha?: string | null;
};

export type TwilioConditionalFetchResult =
  | { status: "unchanged"; sourceUrl: string; cursor: { commitSha: string; etag?: string | null } }
  | { status: "changed"; snapshot: SourceSnapshot; cursor: { commitSha: string; etag?: string | null } };

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parseDocument(body: string): OpenApiDocument {
  const document = JSON.parse(body) as OpenApiDocument;
  if (!document.paths || typeof document.paths !== "object") throw new Error("Twilio OpenAPI document does not contain paths.");
  return document;
}

function operations(document: OpenApiDocument) {
  const values = new Map<string, { path: string; method: string; operationId?: string }>();
  for (const [path, item] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(item)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      values.set(`${method.toUpperCase()} ${path}`, { path, method: method.toUpperCase(), operationId: operation.operationId });
    }
  }
  return values;
}

async function fetchTwilioCommit(fetchImpl: typeof fetch): Promise<string> {
  const response = await fetchImpl(TWILIO_COMMIT_URL, { headers: { Accept: "application/vnd.github+json", "User-Agent": "api-dependency-sentinel/1.0" } });
  if (!response.ok) throw new Error(`Twilio revision acquisition failed with HTTP ${response.status}.`);
  const payload = (await response.json()) as { sha?: string };
  if (!payload.sha || !/^[a-f0-9]{40}$/i.test(payload.sha)) throw new Error("Twilio revision acquisition did not return a valid commit SHA.");
  return payload.sha;
}

export async function fetchTwilioOpenApiConditional(
  cursor: TwilioSourceCursor = {},
  fetchImpl: typeof fetch = fetch
): Promise<TwilioConditionalFetchResult> {
  const commitSha = await fetchTwilioCommit(fetchImpl);
  const sourceUrl = `${TWILIO_OPENAPI_BASE}/${encodeURIComponent(commitSha)}/${TWILIO_SPEC_PATH}`;
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": "api-dependency-sentinel/1.0" };
  if (cursor.etag) headers["If-None-Match"] = cursor.etag;
  const response = await fetchImpl(sourceUrl, { headers });
  const etag = response.headers.get("etag") ?? cursor.etag ?? undefined;
  if (response.status === 304) return { status: "unchanged", sourceUrl, cursor: { commitSha, etag } };
  if (!response.ok) throw new Error(`Twilio OpenAPI acquisition failed with HTTP ${response.status}.`);
  const body = await response.text();
  parseDocument(body);
  return {
    status: "changed",
    cursor: { commitSha, etag },
    snapshot: {
      provider: "twilio",
      sourceKind: "openapi",
      sourceUrl,
      sourceRef: commitSha,
      retrievedAt: new Date().toISOString(),
      contentSha256: sha256(body),
      contentType: response.headers.get("content-type") ?? "application/json",
      body,
    },
  };
}

export async function fetchTwilioOpenApi(ref = "main", fetchImpl: typeof fetch = fetch): Promise<SourceSnapshot> {
  const sourceUrl = `${TWILIO_OPENAPI_BASE}/${encodeURIComponent(ref)}/${TWILIO_SPEC_PATH}`;
  const response = await fetchImpl(sourceUrl, { headers: { Accept: "application/json", "User-Agent": "api-dependency-sentinel/1.0" } });
  if (!response.ok) throw new Error(`Twilio OpenAPI acquisition failed with HTTP ${response.status}.`);
  const body = await response.text();
  parseDocument(body);
  return {
    provider: "twilio",
    sourceKind: "openapi",
    sourceUrl,
    sourceRef: ref,
    retrievedAt: new Date().toISOString(),
    contentSha256: sha256(body),
    contentType: response.headers.get("content-type") ?? "application/json",
    body,
  };
}

export function diffTwilioOpenApi(prior: SourceSnapshot, next: SourceSnapshot): ProviderChange[] {
  if (prior.provider !== "twilio" || next.provider !== "twilio") throw new Error("Twilio OpenAPI diffs require Twilio snapshots.");
  const before = operations(parseDocument(prior.body));
  const after = operations(parseDocument(next.body));
  const changes: ProviderChange[] = [];
  for (const [operation, descriptor] of Array.from(before.entries())) {
    if (after.has(operation)) continue;
    changes.push({
      externalId: `twilio-${sha256([operation, prior.sourceRef, next.sourceRef].join("|"))}`,
      provider: "twilio",
      changeType: "removed",
      breakingAssessment: "structural",
      title: `Removes Twilio operation ${operation}`,
      summary: `The Twilio structured API specification no longer contains ${operation}.`,
      source: { sourceUrl: next.sourceUrl, sourceRef: next.sourceRef, retrievedAt: next.retrievedAt, contentSha256: next.contentSha256 },
      sourceLocator: { kind: "schema_pointer", pointer: `#/paths/${descriptor.path}/${descriptor.method.toLowerCase()}` },
      subjects: [{ provider: "twilio", kind: "http_operation", canonicalName: operation, selector: { method: descriptor.method, path: descriptor.path, operationId: descriptor.operationId ?? "" } }],
    });
  }
  return changes;
}
