import { decodeOAuthState } from "@shared/const";

export function safeOAuthReturnPath(state: string): string {
  const returnTo = decodeOAuthState(state).returnTo;
  if (typeof returnTo !== "string" || !returnTo.startsWith("/") || returnTo.startsWith("//") || returnTo.startsWith("/\\")) {
    return "/";
  }
  return returnTo;
}
