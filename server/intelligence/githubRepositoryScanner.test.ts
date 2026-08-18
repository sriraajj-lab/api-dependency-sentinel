import { describe, expect, it } from "vitest";
import { scanInstalledTypeScriptRepository } from "./githubRepositoryScanner";

describe("installed GitHub repository scanner", () => {
  it("uses a short-lived read-only installation token to extract direct provider evidence from the isolated test repository", async () => {
    const result = await scanInstalledTypeScriptRepository({ repositoryFullName: "sriraajj-lab/api-dependency-sentinel-test" });

    expect(result.commitSha).toMatch(/^[a-f0-9]{40}$/i);
    expect(result.fileCount).toBeGreaterThanOrEqual(3);
    expect(result.evidence.dependencies.map(dependency => dependency.packageName)).toEqual(expect.arrayContaining(["stripe", "openai", "twilio"]));
    expect(result.evidence.codeEvidence.map(evidence => evidence.provider)).toEqual(expect.arrayContaining(["stripe", "openai", "twilio"]));
  }, 30_000);
});
