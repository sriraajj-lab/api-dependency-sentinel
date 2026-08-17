import { describe, expect, it } from "vitest";
import { calculateRiskScore, riskBand } from "../shared/risk";
import { buildDemoRiskMap, supportedProviders } from "./sentinel";

describe("API Dependency Sentinel risk scoring", () => {
  it("ranks urgent, high-confidence, multi-surface changes above low-impact changes", () => {
    const urgentHighRisk = calculateRiskScore({
      severity: "high",
      codeReferenceConfidence: 0.92,
      executionSurface: 3,
      daysUntilDeadline: 14,
    });
    const lowRisk = calculateRiskScore({
      severity: "low",
      codeReferenceConfidence: 0.42,
      executionSurface: 1,
      daysUntilDeadline: 90,
    });

    expect(urgentHighRisk).toBeGreaterThan(lowRisk);
    expect(riskBand(urgentHighRisk)).toMatch(/high|critical/);
    expect(riskBand(lowRisk)).toBe("low");
  });

  it("exposes a demo workspace with source-linked findings and a bounded provider set", () => {
    const riskMap = buildDemoRiskMap();

    expect(supportedProviders).toContain("Stripe");
    expect(riskMap.workspace.mode).toBe("demo");
    expect(riskMap.findings.length).toBeGreaterThan(0);
    expect(riskMap.findings.every((finding) => finding.sourceUrl.startsWith("https://"))).toBe(true);
    expect(riskMap.findings.every((finding) => finding.codePaths.length > 0)).toBe(true);
  });
});
