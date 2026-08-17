import { calculateRiskScore, riskBand, type RiskSeverity } from "../shared/risk";

export type DemoFinding = {
  id: string;
  provider: string;
  providerColor: string;
  type: "Deprecation" | "Schema change" | "SDK release";
  title: string;
  summary: string;
  sourceUrl: string;
  sourceLabel: string;
  codePaths: string[];
  owner: string;
  due: string;
  daysUntilDeadline: number;
  confidence: number;
  severity: RiskSeverity;
  status: "needs_review" | "triaged" | "ignored";
};

export const supportedProviders = ["Stripe", "Shopify", "Twilio", "Slack", "HubSpot", "Meta"] as const;

export const demoFindings: DemoFinding[] = [
  {
    id: "demo-shopify-2026-04",
    provider: "Shopify",
    providerColor: "#95bf47",
    type: "Deprecation",
    title: "Legacy Fulfillment API version reaches retirement window",
    summary: "The monitored provider source indicates a version retirement. Sentinel found fulfillment calls and a webhook handler that likely require migration review.",
    sourceUrl: "https://shopify.dev/docs/api/release-notes",
    sourceLabel: "Official release notes",
    codePaths: ["src/integrations/shopify/fulfillment.ts", "src/webhooks/shopify.ts", "tests/shopify/fulfillment.spec.ts"],
    owner: "M. Chen",
    due: "45 days",
    daysUntilDeadline: 45,
    confidence: 0.92,
    severity: "high",
    status: "needs_review",
  },
  {
    id: "demo-stripe-webhook-schema",
    provider: "Stripe",
    providerColor: "#635bff",
    type: "Schema change",
    title: "Checkout session event adds a payment-state branch",
    summary: "A payload change may affect the current event normalizer. The match is source-backed but requires an owner to confirm its execution path.",
    sourceUrl: "https://docs.stripe.com/changelog",
    sourceLabel: "Official changelog",
    codePaths: ["src/webhooks/stripe/normalize.ts", "src/billing/checkout.ts"],
    owner: "A. Patel",
    due: "No published deadline",
    daysUntilDeadline: 90,
    confidence: 0.81,
    severity: "medium",
    status: "needs_review",
  },
  {
    id: "demo-twilio-sdk",
    provider: "Twilio",
    providerColor: "#f22f46",
    type: "SDK release",
    title: "Messaging SDK update changes retry behavior",
    summary: "A new SDK release alters retry semantics. Sentinel found a bounded client wrapper and prepared a regression-test checklist.",
    sourceUrl: "https://www.twilio.com/changelog",
    sourceLabel: "Official changelog",
    codePaths: ["src/notifications/twilio/client.ts"],
    owner: "D. Ortiz",
    due: "Review this sprint",
    daysUntilDeadline: 21,
    confidence: 0.76,
    severity: "medium",
    status: "triaged",
  },
];

export function buildDemoRiskMap() {
  const findings = demoFindings.map((finding) => ({
    ...finding,
    riskScore: calculateRiskScore({
      severity: finding.severity,
      codeReferenceConfidence: finding.confidence,
      executionSurface: finding.codePaths.length,
      daysUntilDeadline: finding.daysUntilDeadline,
    }),
  }));

  const activeFindings = findings.filter((finding) => finding.status !== "ignored");
  const highestRisk = Math.max(...activeFindings.map((finding) => finding.riskScore));

  return {
    workspace: {
      repository: "demo/commerce-api",
      branch: "main",
      scannedAt: "Demo data · just now",
      mode: "demo" as const,
    },
    summary: {
      monitoredProviders: 3,
      activeFindings: activeFindings.length,
      highestRisk,
      confidence: 87,
      band: riskBand(highestRisk),
    },
    findings,
  };
}
