import type { ProviderChange } from "../../shared/intelligence";
import { getProviderPollState, recordProviderPollRun, upsertProviderPollState } from "../db";
import { fetchOpenAiChangelogConditional, normalizeOpenAiChangelog, type OpenAiSourceCursor } from "./openaiAdapter";

const OPENAI_SOURCE_URL = "https://developers.openai.com/api/docs/changelog";

export type OpenAiPollResult = {
  provider: "openai";
  outcome: "unchanged" | "changed" | "failed";
  priorCommitSha?: string;
  nextCommitSha?: string;
  changeCount: number;
  changes: ProviderChange[];
};

export async function pollOpenAiRevision(fetchImpl: typeof fetch = fetch): Promise<OpenAiPollResult> {
  const now = new Date();
  const state = await getProviderPollState("openai");
  const cursor: OpenAiSourceCursor = { etag: state?.etag, sourceRef: state?.commitSha, contentSha256: state?.contentSha256 };
  try {
    const current = await fetchOpenAiChangelogConditional(cursor, fetchImpl);
    if (current.status === "unchanged") {
      await upsertProviderPollState({ provider: "openai", sourceUrl: state?.sourceUrl ?? current.sourceUrl, scheduleCronTaskUid: state?.scheduleCronTaskUid, etag: current.cursor.etag, commitSha: current.cursor.sourceRef, contentSha256: current.cursor.contentSha256, lastAttemptAt: now, lastSuccessAt: now, lastStatus: "unchanged", lastError: null });
      await recordProviderPollRun({ provider: "openai", priorCommitSha: state?.commitSha, nextCommitSha: current.cursor.sourceRef, etag: current.cursor.etag, contentSha256: current.cursor.contentSha256, outcome: "unchanged" });
      return { provider: "openai", outcome: "unchanged", priorCommitSha: state?.commitSha ?? undefined, nextCommitSha: current.cursor.sourceRef, changeCount: 0, changes: [] };
    }
    const changes = normalizeOpenAiChangelog(current.snapshot);
    await upsertProviderPollState({ provider: "openai", sourceUrl: current.snapshot.sourceUrl, scheduleCronTaskUid: state?.scheduleCronTaskUid, etag: current.cursor.etag, commitSha: current.cursor.sourceRef, contentSha256: current.cursor.contentSha256, lastAttemptAt: now, lastSuccessAt: now, lastStatus: "changed", lastError: null });
    await recordProviderPollRun({ provider: "openai", priorCommitSha: state?.commitSha, nextCommitSha: current.cursor.sourceRef, etag: current.cursor.etag, contentSha256: current.cursor.contentSha256, outcome: "changed", changeCount: changes.length });
    return { provider: "openai", outcome: "changed", priorCommitSha: state?.commitSha ?? undefined, nextCommitSha: current.cursor.sourceRef, changeCount: changes.length, changes };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI polling failure";
    await upsertProviderPollState({ provider: "openai", sourceUrl: state?.sourceUrl ?? OPENAI_SOURCE_URL, scheduleCronTaskUid: state?.scheduleCronTaskUid, etag: state?.etag, commitSha: state?.commitSha, contentSha256: state?.contentSha256, lastAttemptAt: now, lastSuccessAt: state?.lastSuccessAt ?? null, lastStatus: "failed", lastError: message });
    await recordProviderPollRun({ provider: "openai", priorCommitSha: state?.commitSha, nextCommitSha: state?.commitSha, etag: state?.etag, contentSha256: state?.contentSha256, outcome: "failed", errorSummary: message });
    throw new Error(`OpenAI revision poll failed: ${message}`);
  }
}
