export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Sign in with GitHub. Call from an event handler, never during render.
export const startLogin = (_returnTo = "/") => {
  window.location.href = "/api/github/connect/start";
};
