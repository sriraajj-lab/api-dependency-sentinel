import { createHash } from "node:crypto";
import type { ImpactCandidate, ProviderChange, RepositoryEvidence } from "../../shared/intelligence";

const MATCHER_VERSION = "ts-direct-v1";

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function severityFor(change: ProviderChange, confidence: number): ImpactCandidate["severity"] {
  if (change.breakingAssessment === "provider_declared" && confidence >= 0.8) return "critical";
  if (change.breakingAssessment === "structural" && confidence >= 0.8) return "high";
  if (change.breakingAssessment === "structural" || confidence >= 0.55) return "medium";
  return "low";
}

function subjectMatches(candidate: string | undefined, subjectName: string) {
  if (!candidate) return false;
  if (candidate === subjectName) return true;
  const subjectTail = subjectName.split(" ").pop() ?? subjectName;
  return candidate.includes(subjectTail) || subjectName.includes(candidate);
}

function directSdkName(change: ProviderChange) {
  const subject = change.subjects.find(item => item.kind === "sdk_method" || item.kind === "http_operation");
  if (!subject) return undefined;
  const selector = subject.selector;
  if (selector.sdkMethod) return selector.sdkMethod;
  if (change.provider === "stripe" && selector.path === "/v1/payment_intents" && selector.method === "POST") return "stripe.paymentIntents.create";
  if (change.provider === "openai" && selector.path === "/v1/responses" && selector.method === "POST") return "openai.responses.create";
  if (change.provider === "twilio" && selector.path?.includes("/Messages") && selector.method === "POST") return "twilio.messages.create";
  return undefined;
}

export function matchChangeToRepository(change: ProviderChange, repository: RepositoryEvidence): ImpactCandidate | undefined {
  const scoreReasons: string[] = [];
  const providerDependencies = repository.dependencies.filter(dependency => {
    if (change.provider === "stripe") return dependency.packageName === "stripe" || dependency.packageName === "@stripe/stripe-js";
    if (change.provider === "openai") return dependency.packageName === "openai";
    return dependency.packageName === "twilio";
  });
  const providerEvidence = repository.codeEvidence.filter(evidence => evidence.provider === change.provider);
  const relevantSdkName = directSdkName(change);
  const matchingCalls = providerEvidence.filter(
    evidence => evidence.kind === "direct_sdk_call" && (!relevantSdkName || subjectMatches(evidence.subjectCandidate, relevantSdkName))
  );
  const matchingLiterals = providerEvidence.filter(evidence => evidence.kind === "endpoint_literal" || evidence.kind === "model_literal");

  let confidence = 0;
  if (providerDependencies.length > 0) {
    confidence += 0.2;
    scoreReasons.push("The repository resolves an affected provider package.");
  }
  if (providerEvidence.some(evidence => evidence.kind === "import")) {
    confidence += 0.2;
    scoreReasons.push("A source file imports the affected provider package.");
  }
  if (providerEvidence.some(evidence => evidence.kind === "client_construction")) {
    confidence += 0.15;
    scoreReasons.push("A source file constructs an affected provider client.");
  }
  if (matchingCalls.length > 0) {
    confidence += 0.35;
    scoreReasons.push("A direct SDK call matches the normalized provider subject.");
  } else if (matchingLiterals.length > 0) {
    confidence += 0.2;
    scoreReasons.push("A provider endpoint or model literal appears in the repository.");
  }

  if (confidence < 0.2) return undefined;
  const boundedConfidence = Math.min(confidence, 0.95);
  const codeEvidence = matchingCalls.length > 0 ? matchingCalls : providerEvidence.filter(evidence => evidence.kind !== "import");
  const dedupeKey = hash(
    [change.externalId, repository.repositoryFullName, repository.commitSha, ...codeEvidence.map(item => item.snippetSha256), MATCHER_VERSION].join("|")
  );

  return {
    dedupeKey,
    change,
    repository: { ...repository, codeEvidence },
    confidence: boundedConfidence,
    severity: severityFor(change, boundedConfidence),
    scoreReasons,
  };
}

export { MATCHER_VERSION };
