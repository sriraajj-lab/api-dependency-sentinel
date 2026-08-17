export type RiskSeverity = "critical" | "high" | "medium" | "low";

export type RiskSignal = {
  severity: RiskSeverity;
  codeReferenceConfidence: number;
  executionSurface: number;
  daysUntilDeadline?: number | null;
};

const severityWeight: Record<RiskSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function calculateRiskScore(signal: RiskSignal) {
  const confidence = Math.max(0.35, Math.min(signal.codeReferenceConfidence, 1));
  const surface = Math.max(1, Math.min(signal.executionSurface, 4));
  const urgency = signal.daysUntilDeadline === undefined || signal.daysUntilDeadline === null
    ? 1
    : signal.daysUntilDeadline <= 14
      ? 1.5
      : signal.daysUntilDeadline <= 45
        ? 1.25
        : 1;

  return Math.min(100, Math.round(severityWeight[signal.severity] * confidence * surface * urgency * 15));
}

export function riskBand(score: number): RiskSeverity {
  if (score >= 76) return "critical";
  if (score >= 52) return "high";
  if (score >= 28) return "medium";
  return "low";
}
