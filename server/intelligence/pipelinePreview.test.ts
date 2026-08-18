import { describe, expect, it } from "vitest";
import { buildPipelinePreviewRiskMap } from "./pipelinePreview";

describe("Pipeline preview", () => {
  it("renders a reviewer record whose source, commit, code location, and scoring evidence are all present", () => {
    const preview = buildPipelinePreviewRiskMap();
    const finding = preview.findings[0];

    expect(preview.workspace.mode).toBe("pipeline_fixture");
    expect(finding).toMatchObject({
      provider: "Stripe",
      type: "Schema change",
      sourcePointer: expect.stringContaining("payment_intents"),
      evidence: expect.objectContaining({ matcherVersion: "ts-direct-v1", provenanceNodeCount: expect.any(Number) }),
    });
    expect(finding.codePaths[0]).toContain("src/billing/create-payment-intent.ts");
    expect(finding.evidence.scoreReasons).toContain("A direct SDK call matches the normalized provider subject.");
  });
});
