import { pollOpenAiRevision } from "./intelligence/openaiPolling";
import { pollStripeRevision } from "./intelligence/stripePolling";
import { pollTwilioRevision } from "./intelligence/twilioPolling";

const providerPolls = [
  { provider: "stripe", poll: () => pollStripeRevision() },
  { provider: "openai", poll: () => pollOpenAiRevision() },
  { provider: "twilio", poll: () => pollTwilioRevision() },
];

export async function runProviderPolls() {
  for (const { provider, poll } of providerPolls) {
    try {
      const result = await poll();
      console.info(`[Scheduler] ${provider} poll: ${result.outcome}`);
    } catch (error) {
      console.error(`[Scheduler] ${provider} poll failed`, error);
    }
  }
}

export function startProviderPollScheduler() {
  const hours = Number(process.env.PROVIDER_POLL_INTERVAL_HOURS ?? "6");
  if (!process.env.DATABASE_URL || !(hours > 0)) return;
  const intervalMs = hours * 60 * 60 * 1000;
  setTimeout(() => void runProviderPolls(), 60_000);
  setInterval(() => void runProviderPolls(), intervalMs).unref();
}
