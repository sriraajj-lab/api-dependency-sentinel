import { describe, expect, it } from "vitest";
import { encodeOAuthState } from "@shared/const";
import { safeOAuthReturnPath } from "./_core/oauth";

describe("safeOAuthReturnPath", () => {
  it("preserves the authenticated repository onboarding return path", () => {
    expect(safeOAuthReturnPath(encodeOAuthState({ redirectUri: "https://sentinel.example/api/oauth/callback", nonce: "nonce", returnTo: "/connect/github" }))).toBe("/connect/github");
  });

  it("rejects external and malformed destinations", () => {
    expect(safeOAuthReturnPath(encodeOAuthState({ redirectUri: "https://sentinel.example/api/oauth/callback", returnTo: "https://attacker.example" }))).toBe("/");
    expect(safeOAuthReturnPath(encodeOAuthState({ redirectUri: "https://sentinel.example/api/oauth/callback", returnTo: "//attacker.example" }))).toBe("/");
  });
});
