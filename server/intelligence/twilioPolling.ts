import type { ProviderChange } from "../../shared/intelligence";
import { getProviderPollState, recordProviderPollRun, upsertProviderPollState } from "../db";
import { diffTwilioOpenApi, fetchTwilioOpenApi, fetchTwilioOpenApiConditional, type TwilioSourceCursor } from "./twilioAdapter";

const TWILIO_SOURCE_URL = "https://raw.githubusercontent.com/twilio/twilio-oai";

export type TwilioPollResult = {
  provider: "twilio";
  outcome: "unchanged" | "changed" | "failed";
  priorCommitSha?: string;
  nextCommitSha?: string;
  changeCount: number;
  changes: ProviderChange[];
};

export async function pollTwilioRevision(fetchImpl: typeof fetch = fetch): Promise<TwilioPollResult> {
  const now = new Date();
  const state = await getProviderPollState("twilio");
  const cursor: TwilioSourceCursor = { etag: state?.etag, commitSha: state?.commitSha };
  try {
    const current = await fetchTwilioOpenApiConditional(cursor, fetchImpl);
    if (current.status === "unchanged") {
      await upsertProviderPollState({ provider: "twilio", sourceUrl: state?.sourceUrl ?? current.sourceUrl, scheduleCronTaskUid: state?.scheduleCronTaskUid, etag: current.cursor.etag, commitSha: current.cursor.commitSha, contentSha256: state?.contentSha256, lastAttemptAt: now, lastSuccessAt: now, lastStatus: "unchanged", lastError: null });
      await recordProviderPollRun({ provider: "twilio", priorCommitSha: state?.commitSha, nextCommitSha: current.cursor.commitSha, etag: current.cursor.etag, contentSha256: state?.contentSha256, outcome: "unchanged" });
      return { provider: "twilio", outcome: "unchanged", priorCommitSha: state?.commitSha ?? undefined, nextCommitSha: current.cursor.commitSha, changeCount: 0, changes: [] };
    }
    let changes: ProviderChange[] = [];
    if (state?.commitSha && state.commitSha !== current.cursor.commitSha) changes = diffTwilioOpenApi(await fetchTwilioOpenApi(state.commitSha, fetchImpl), current.snapshot);
    await upsertProviderPollState({ provider: "twilio", sourceUrl: current.snapshot.sourceUrl, scheduleCronTaskUid: state?.scheduleCronTaskUid, etag: current.cursor.etag, commitSha: current.cursor.commitSha, contentSha256: current.snapshot.contentSha256, lastAttemptAt: now, lastSuccessAt: now, lastStatus: "changed", lastError: null });
    await recordProviderPollRun({ provider: "twilio", priorCommitSha: state?.commitSha, nextCommitSha: current.cursor.commitSha, etag: current.cursor.etag, contentSha256: current.snapshot.contentSha256, outcome: "changed", changeCount: changes.length });
    return { provider: "twilio", outcome: "changed", priorCommitSha: state?.commitSha ?? undefined, nextCommitSha: current.cursor.commitSha, changeCount: changes.length, changes };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Twilio polling failure";
    await upsertProviderPollState({ provider: "twilio", sourceUrl: state?.sourceUrl ?? TWILIO_SOURCE_URL, scheduleCronTaskUid: state?.scheduleCronTaskUid, etag: state?.etag, commitSha: state?.commitSha, contentSha256: state?.contentSha256, lastAttemptAt: now, lastSuccessAt: state?.lastSuccessAt ?? null, lastStatus: "failed", lastError: message });
    await recordProviderPollRun({ provider: "twilio", priorCommitSha: state?.commitSha, nextCommitSha: state?.commitSha, etag: state?.etag, contentSha256: state?.contentSha256, outcome: "failed", errorSummary: message });
    throw new Error(`Twilio revision poll failed: ${message}`);
  }
}
