import type { ProviderChange } from "../../shared/intelligence";
import { getProviderPollState, recordProviderPollRun, upsertProviderPollState } from "../db";
import { diffStripeOpenApi, fetchStripeOpenApi, fetchStripeOpenApiConditional, type StripeSourceCursor } from "./stripeAdapter";

const STRIPE_SOURCE_URL = "https://raw.githubusercontent.com/stripe/openapi";

export type StripePollResult = {
  provider: "stripe";
  outcome: "unchanged" | "changed" | "failed";
  priorCommitSha?: string;
  nextCommitSha?: string;
  changeCount: number;
  changes: ProviderChange[];
};

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export async function pollStripeRevision(fetchImpl: FetchLike = fetch): Promise<StripePollResult> {
  const now = new Date();
  const state = await getProviderPollState("stripe");
  const cursor: StripeSourceCursor = { etag: state?.etag, commitSha: state?.commitSha };

  try {
    const current = await fetchStripeOpenApiConditional(cursor, fetchImpl);
    if (current.status === "unchanged") {
      await upsertProviderPollState({
        provider: "stripe",
        sourceUrl: state?.sourceUrl ?? current.sourceUrl,
        scheduleCronTaskUid: state?.scheduleCronTaskUid,
        etag: current.cursor.etag,
        commitSha: current.cursor.commitSha,
        contentSha256: state?.contentSha256,
        lastAttemptAt: now,
        lastSuccessAt: now,
        lastStatus: "unchanged",
        lastError: null,
      });
      await recordProviderPollRun({
        provider: "stripe",
        priorCommitSha: state?.commitSha,
        nextCommitSha: current.cursor.commitSha,
        etag: current.cursor.etag,
        contentSha256: state?.contentSha256,
        outcome: "unchanged",
      });
      return { provider: "stripe", outcome: "unchanged", priorCommitSha: state?.commitSha ?? undefined, nextCommitSha: current.cursor.commitSha, changeCount: 0, changes: [] };
    }

    let changes: ProviderChange[] = [];
    if (state?.commitSha && state.commitSha !== current.cursor.commitSha) {
      const prior = await fetchStripeOpenApi(state.commitSha, fetchImpl);
      changes = diffStripeOpenApi(prior, current.snapshot);
    }

    await upsertProviderPollState({
      provider: "stripe",
      sourceUrl: current.snapshot.sourceUrl,
      scheduleCronTaskUid: state?.scheduleCronTaskUid,
      etag: current.cursor.etag,
      commitSha: current.cursor.commitSha,
      contentSha256: current.snapshot.contentSha256,
      lastAttemptAt: now,
      lastSuccessAt: now,
      lastStatus: "changed",
      lastError: null,
    });
    await recordProviderPollRun({
      provider: "stripe",
      priorCommitSha: state?.commitSha,
      nextCommitSha: current.cursor.commitSha,
      etag: current.cursor.etag,
      contentSha256: current.snapshot.contentSha256,
      outcome: "changed",
      changeCount: changes.length,
    });
    return { provider: "stripe", outcome: "changed", priorCommitSha: state?.commitSha ?? undefined, nextCommitSha: current.cursor.commitSha, changeCount: changes.length, changes };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Stripe polling failure";
    await upsertProviderPollState({
      provider: "stripe",
      sourceUrl: state?.sourceUrl ?? STRIPE_SOURCE_URL,
      scheduleCronTaskUid: state?.scheduleCronTaskUid,
      etag: state?.etag,
      commitSha: state?.commitSha,
      contentSha256: state?.contentSha256,
      lastAttemptAt: now,
      lastSuccessAt: state?.lastSuccessAt ?? null,
      lastStatus: "failed",
      lastError: message,
    });
    await recordProviderPollRun({
      provider: "stripe",
      priorCommitSha: state?.commitSha,
      nextCommitSha: state?.commitSha,
      etag: state?.etag,
      contentSha256: state?.contentSha256,
      outcome: "failed",
      errorSummary: message,
    });
    throw new Error(`Stripe revision poll failed: ${message}`);
  }
}
