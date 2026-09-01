export const GITHUB_CONNECT_PATH = "/connect/github";

export function getUnauthenticatedRedirectPath(pathname: string): string | null {
  return pathname === GITHUB_CONNECT_PATH ? null : GITHUB_CONNECT_PATH;
}
