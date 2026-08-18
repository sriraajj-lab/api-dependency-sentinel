import { createHash } from "node:crypto";
import type { ProviderChange, SourceSnapshot } from "../../shared/intelligence";

type OpenApiSchema = {
  type?: string;
  required?: string[];
  properties?: Record<string, OpenApiSchema>;
};

type OpenApiOperation = {
  operationId?: string;
  requestBody?: {
    content?: Record<string, { schema?: OpenApiSchema }>;
  };
};

type OpenApiDocument = {
  paths?: Record<string, Record<string, OpenApiOperation>>;
};

const STRIPE_OPENAPI_URL = "https://raw.githubusercontent.com/stripe/openapi";
const STRIPE_COMMIT_URL = "https://api.github.com/repos/stripe/openapi/commits/master";
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete"]);

export type StripeSourceCursor = {
  etag?: string | null;
  commitSha?: string | null;
};

export type StripeConditionalFetchResult =
  | { status: "unchanged"; cursor: { commitSha: string; etag?: string | null }; sourceUrl: string }
  | { status: "changed"; cursor: { commitSha: string; etag?: string | null }; snapshot: SourceSnapshot };

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parseDocument(body: string): OpenApiDocument {
  try {
    const parsed = JSON.parse(body) as OpenApiDocument;
    if (!parsed.paths || typeof parsed.paths !== "object") {
      throw new Error("OpenAPI document does not contain a paths object.");
    }
    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse failure";
    throw new Error(`Unable to parse Stripe OpenAPI JSON: ${message}`);
  }
}

function getRequestSchema(operation: OpenApiOperation) {
  const content = operation.requestBody?.content;
  if (!content) return undefined;
  return content["application/json"]?.schema ?? Object.values(content)[0]?.schema;
}

function operationKey(method: string, path: string) {
  return `${method.toUpperCase()} ${path}`;
}

function getOperations(document: OpenApiDocument) {
  const operations = new Map<string, { path: string; method: string; operation: OpenApiOperation }>();
  for (const [path, pathItem] of Object.entries(document.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) continue;
      operations.set(operationKey(method, path), { path, method: method.toUpperCase(), operation });
    }
  }
  return operations;
}

function externalId(parts: string[]) {
  return `stripe-${sha256(parts.join("|"))}`;
}

function buildOperationChange(input: {
  type: "added" | "removed";
  path: string;
  method: string;
  prior: SourceSnapshot;
  next: SourceSnapshot;
}): ProviderChange {
  const subjectName = operationKey(input.method, input.path);
  const isRemoval = input.type === "removed";
  return {
    externalId: externalId([input.type, subjectName, input.prior.sourceRef, input.next.sourceRef]),
    provider: "stripe",
    changeType: input.type,
    breakingAssessment: isRemoval ? "structural" : "potential",
    title: `${isRemoval ? "Removes" : "Adds"} Stripe operation ${subjectName}`,
    summary: isRemoval
      ? `The structured Stripe specification no longer contains ${subjectName}.`
      : `The structured Stripe specification now contains ${subjectName}.`,
    source: {
      sourceUrl: input.next.sourceUrl,
      sourceRef: input.next.sourceRef,
      retrievedAt: input.next.retrievedAt,
      contentSha256: input.next.contentSha256,
    },
    sourceLocator: {
      kind: "schema_pointer",
      pointer: `#/paths/${input.path}/${input.method.toLowerCase()}`,
    },
    subjects: [
      {
        provider: "stripe",
        kind: "http_operation",
        canonicalName: subjectName,
        selector: { method: input.method, path: input.path },
      },
    ],
  };
}

function buildRequirednessChange(input: {
  path: string;
  method: string;
  property: string;
  beforeRequired: boolean;
  afterRequired: boolean;
  prior: SourceSnapshot;
  next: SourceSnapshot;
}): ProviderChange {
  const operation = operationKey(input.method, input.path);
  const subjectName = `${operation} request.${input.property}`;
  return {
    externalId: externalId([
      "requiredness_changed",
      subjectName,
      String(input.beforeRequired),
      String(input.afterRequired),
      input.prior.sourceRef,
      input.next.sourceRef,
    ]),
    provider: "stripe",
    changeType: "requiredness_changed",
    breakingAssessment: input.afterRequired ? "structural" : "potential",
    title: `Changes requiredness of ${input.property} in ${operation}`,
    summary: input.afterRequired
      ? `Stripe now marks request property ${input.property} as required for ${operation}.`
      : `Stripe no longer marks request property ${input.property} as required for ${operation}.`,
    source: {
      sourceUrl: input.next.sourceUrl,
      sourceRef: input.next.sourceRef,
      retrievedAt: input.next.retrievedAt,
      contentSha256: input.next.contentSha256,
    },
    sourceLocator: {
      kind: "schema_pointer",
      pointer: `#/paths/${input.path}/${input.method.toLowerCase()}/requestBody/content/application~1json/schema/properties/${input.property}`,
      beforeValue: String(input.beforeRequired),
      afterValue: String(input.afterRequired),
    },
    subjects: [
      {
        provider: "stripe",
        kind: "request_property",
        canonicalName: subjectName,
        selector: { method: input.method, path: input.path, property: input.property },
      },
    ],
  };
}

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

async function fetchStripeCommit(fetchImpl: FetchLike): Promise<string> {
  let response: Response;
  try {
    response = await fetchImpl(STRIPE_COMMIT_URL, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "api-dependency-sentinel/1.0" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network failure";
    throw new Error(`Stripe revision acquisition failed: ${message}`);
  }
  if (!response.ok) throw new Error(`Stripe revision acquisition failed with HTTP ${response.status}.`);
  const payload = (await response.json()) as { sha?: string };
  if (!payload.sha || !/^[a-f0-9]{40}$/i.test(payload.sha)) {
    throw new Error("Stripe revision acquisition did not return a valid commit SHA.");
  }
  return payload.sha;
}

export async function fetchStripeOpenApiConditional(
  cursor: StripeSourceCursor = {},
  fetchImpl: FetchLike = fetch
): Promise<StripeConditionalFetchResult> {
  const commitSha = await fetchStripeCommit(fetchImpl);
  const sourceUrl = `${STRIPE_OPENAPI_URL}/${encodeURIComponent(commitSha)}/latest/spec3.json`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "api-dependency-sentinel/1.0",
  };
  if (cursor.etag) headers["If-None-Match"] = cursor.etag;

  let response: Response;
  try {
    response = await fetchImpl(sourceUrl, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network failure";
    throw new Error(`Stripe OpenAPI acquisition failed: ${message}`);
  }
  const etag = response.headers.get("etag") ?? cursor.etag ?? undefined;
  if (response.status === 304) {
    return { status: "unchanged", sourceUrl, cursor: { commitSha, etag } };
  }
  if (!response.ok) throw new Error(`Stripe OpenAPI acquisition failed with HTTP ${response.status}.`);

  const body = await response.text();
  parseDocument(body);
  return {
    status: "changed",
    cursor: { commitSha, etag },
    snapshot: {
      provider: "stripe",
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

export async function fetchStripeOpenApi(ref = "master", fetchImpl: FetchLike = fetch): Promise<SourceSnapshot> {
  if (ref === "master") {
    const result = await fetchStripeOpenApiConditional({}, fetchImpl);
    if (result.status === "changed") return result.snapshot;
    throw new Error("Stripe OpenAPI baseline unexpectedly returned 304 without an ETag cursor.");
  }
  const encodedRef = encodeURIComponent(ref);
  const sourceUrl = `${STRIPE_OPENAPI_URL}/${encodedRef}/latest/spec3.json`;
  let response: Response;

  try {
    response = await fetchImpl(sourceUrl, {
      headers: { Accept: "application/json", "User-Agent": "api-dependency-sentinel/1.0" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network failure";
    throw new Error(`Stripe OpenAPI acquisition failed: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`Stripe OpenAPI acquisition failed with HTTP ${response.status}.`);
  }

  const body = await response.text();
  parseDocument(body);

  return {
    provider: "stripe",
    sourceKind: "openapi",
    sourceUrl,
    sourceRef: ref,
    retrievedAt: new Date().toISOString(),
    contentSha256: sha256(body),
    contentType: response.headers.get("content-type") ?? "application/json",
    body,
  };
}

export function diffStripeOpenApi(prior: SourceSnapshot, next: SourceSnapshot): ProviderChange[] {
  if (prior.provider !== "stripe" || next.provider !== "stripe") {
    throw new Error("Stripe OpenAPI diffs require Stripe source snapshots.");
  }

  const priorOperations = getOperations(parseDocument(prior.body));
  const nextOperations = getOperations(parseDocument(next.body));
  const changes: ProviderChange[] = [];

  for (const [key, priorOperation] of Array.from(priorOperations.entries())) {
    const nextOperation = nextOperations.get(key);
    if (!nextOperation) {
      changes.push(buildOperationChange({ type: "removed", ...priorOperation, prior, next }));
      continue;
    }

    const priorSchema = getRequestSchema(priorOperation.operation);
    const nextSchema = getRequestSchema(nextOperation.operation);
    if (!priorSchema || !nextSchema) continue;

    const propertyNames = new Set([...Object.keys(priorSchema.properties ?? {}), ...Object.keys(nextSchema.properties ?? {})]);
    for (const property of Array.from(propertyNames)) {
      if (!(priorSchema.properties ?? {})[property] || !(nextSchema.properties ?? {})[property]) continue;
      const beforeRequired = priorSchema.required?.includes(property) ?? false;
      const afterRequired = nextSchema.required?.includes(property) ?? false;
      if (beforeRequired !== afterRequired) {
        changes.push(
          buildRequirednessChange({
            path: priorOperation.path,
            method: priorOperation.method,
            property,
            beforeRequired,
            afterRequired,
            prior,
            next,
          })
        );
      }
    }
  }

  for (const [key, nextOperation] of Array.from(nextOperations.entries())) {
    if (!priorOperations.has(key)) {
      changes.push(buildOperationChange({ type: "added", ...nextOperation, prior, next }));
    }
  }

  return changes;
}
