import { createHash } from "node:crypto";
import type { ProviderChange, SourceSnapshot } from "../../shared/intelligence";

const OPENAI_CHANGELOG_URL = "https://developers.openai.com/api/docs/changelog";

export type OpenAiSourceCursor = {
  etag?: string | null;
  sourceRef?: string | null;
  contentSha256?: string | null;
};

export type OpenAiConditionalFetchResult =
  | { status: "unchanged"; sourceUrl: string; cursor: { etag?: string | null; sourceRef: string; contentSha256: string } }
  | { status: "changed"; snapshot: SourceSnapshot; cursor: { etag?: string | null; sourceRef: string; contentSha256: string } };

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function htmlToText(html: string) {
  return html
    .replace(/<h[1-6][^>]*>/gi, "\n### ")
    .replace(/<\/(?:h[1-6]|p|li|section|article|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function changeId(parts: string[]) {
  return `openai-${sha256(parts.join("|"))}`;
}

function firstSubjects(text: string): ProviderChange["subjects"] {
  const subjects: ProviderChange["subjects"] = [];
  const seen = new Set<string>();
  const candidates = Array.from(text.matchAll(/\b(?:gpt-[a-z0-9._-]+|o\d(?:-[a-z0-9._-]+)?|text-[a-z0-9._-]+|whisper-[a-z0-9._-]+|dall-e-[a-z0-9._-]+)\b/gi));
  for (const candidate of candidates) {
    const model = candidate[0];
    if (seen.has(model)) continue;
    seen.add(model);
    subjects.push({ provider: "openai", kind: "model_identifier", canonicalName: model, selector: { model } });
  }
  const endpoints = Array.from(text.matchAll(/\/v1\/[a-z0-9_\-/{}]+/gi));
  for (const candidate of endpoints) {
    const operation = candidate[0];
    if (seen.has(operation)) continue;
    seen.add(operation);
    subjects.push({ provider: "openai", kind: "http_operation", canonicalName: operation, selector: { path: operation } });
  }
  return subjects.length > 0 ? subjects : [{ provider: "openai", kind: "sdk_method", canonicalName: "openai-api-changelog-entry", selector: {} }];
}

export async function fetchOpenAiChangelogConditional(
  cursor: OpenAiSourceCursor = {},
  fetchImpl: typeof fetch = fetch
): Promise<OpenAiConditionalFetchResult> {
  const headers: Record<string, string> = { Accept: "text/html", "User-Agent": "api-dependency-sentinel/1.0" };
  if (cursor.etag) headers["If-None-Match"] = cursor.etag;
  const response = await fetchImpl(OPENAI_CHANGELOG_URL, { headers });
  const etag = response.headers.get("etag") ?? cursor.etag ?? undefined;
  const knownRef = etag ?? cursor.sourceRef ?? cursor.contentSha256;
  if (response.status === 304) {
    if (!knownRef || !cursor.contentSha256) throw new Error("OpenAI changelog returned 304 without a durable prior cursor.");
    return { status: "unchanged", sourceUrl: OPENAI_CHANGELOG_URL, cursor: { etag, sourceRef: knownRef, contentSha256: cursor.contentSha256 } };
  }
  if (!response.ok) throw new Error(`OpenAI changelog acquisition failed with HTTP ${response.status}.`);
  const rawBody = await response.text();
  const body = htmlToText(rawBody);
  if (!body.includes("Changelog")) throw new Error("OpenAI changelog did not contain the expected heading.");
  const contentSha256 = sha256(rawBody);
  const sourceRef = etag ?? contentSha256;
  const snapshot: SourceSnapshot = {
    provider: "openai",
    sourceKind: "changelog",
    sourceUrl: OPENAI_CHANGELOG_URL,
    sourceRef,
    retrievedAt: new Date().toISOString(),
    contentSha256,
    contentType: response.headers.get("content-type") ?? "text/html",
    body,
  };
  if (cursor.contentSha256 === contentSha256) {
    return { status: "unchanged", sourceUrl: OPENAI_CHANGELOG_URL, cursor: { etag, sourceRef, contentSha256 } };
  }
  return { status: "changed", snapshot, cursor: { etag, sourceRef, contentSha256 } };
}

export async function fetchOpenAiChangelog(fetchImpl: typeof fetch = fetch): Promise<SourceSnapshot> {
  const result = await fetchOpenAiChangelogConditional({}, fetchImpl);
  if (result.status === "changed") return result.snapshot;
  throw new Error("OpenAI changelog baseline unexpectedly returned unchanged without a cursor.");
}

export function normalizeOpenAiChangelog(snapshot: SourceSnapshot): ProviderChange[] {
  if (snapshot.provider !== "openai" || snapshot.sourceKind !== "changelog") throw new Error("OpenAI changelog normalization requires an OpenAI changelog snapshot.");
  const lines = snapshot.body.split("\n").map(line => line.trim()).filter(Boolean);
  const changes: ProviderChange[] = [];
  let section = "Undated";
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^###\s+/.test(line)) {
      section = line.replace(/^###\s+/, "");
      continue;
    }
    if (!/^(?:[A-Z][a-z]{2,8}\s+\d{1,2}|\d{4}-\d{2}-\d{2})\b/.test(line)) continue;
    const excerpt = [line, lines[index + 1] ?? ""].filter(Boolean).join(" ").slice(0, 1200);
    const isBreaking = /\b(deprecat|remov|sunset|shut.?down|retir)/i.test(excerpt);
    const subjects = firstSubjects(excerpt);
    changes.push({
      externalId: changeId([section, excerpt, snapshot.contentSha256]),
      provider: "openai",
      changeType: isBreaking ? "deprecated" : "behavior_changed",
      breakingAssessment: isBreaking ? "provider_declared" : "potential",
      title: `OpenAI changelog: ${line}`.slice(0, 500),
      summary: excerpt,
      source: { sourceUrl: snapshot.sourceUrl, sourceRef: snapshot.sourceRef, retrievedAt: snapshot.retrievedAt, contentSha256: snapshot.contentSha256 },
      sourceLocator: { kind: "document_excerpt", pointer: `section:${section}`, excerpt },
      subjects,
    });
  }
  return changes;
}

function changelogFingerprint(change: ProviderChange) {
  return [change.title, change.sourceLocator.pointer ?? "", change.sourceLocator.excerpt ?? ""].join("|");
}

export function diffOpenAiChangelog(prior: SourceSnapshot, next: SourceSnapshot): ProviderChange[] {
  if (prior.provider !== "openai" || next.provider !== "openai") throw new Error("OpenAI changelog diffs require OpenAI snapshots.");
  const priorFingerprints = new Set(normalizeOpenAiChangelog(prior).map(changelogFingerprint));
  return normalizeOpenAiChangelog(next).filter(change => !priorFingerprints.has(changelogFingerprint(change)));
}
