import { randomUUID } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request, Response } from "express";
import { createGitHubConnectSession, getGitHubConnectSession, getUserByOpenId, saveGitHubConnectCandidates, upsertUser } from "./db";
import { exchangeGitHubUserCode, getGitHubAuthenticatedUser, listGitHubConnectCandidates } from "./intelligence/githubRepositoryScanner";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

const SESSION_TTL_MS = 10 * 60 * 1000;
const GITHUB_CONNECT_STATE_COOKIE = "__Host-github_connect_state";

function originFor(req: Request) {
  return `${req.protocol}://${req.get("host")}`;
}

function callbackUrl(req: Request) {
  return `${originFor(req)}/api/github/connect/callback`;
}

export function githubConnectStateMatches(requestCookie: string | undefined, state: string) {
  return Boolean(state) && parseCookieHeader(requestCookie ?? "")[GITHUB_CONNECT_STATE_COOKIE] === state;
}

export function createGitHubConnectHandlers() {
  return {
    start: async (req: Request, res: Response) => {
      try {
        const clientId = process.env.GITHUB_APP_CLIENT_ID;
        if (!clientId) throw new Error("GitHub App client ID is not configured.");
        const state = randomUUID();
        await createGitHubConnectSession({ state, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
        res.cookie(GITHUB_CONNECT_STATE_COOKIE, state, { httpOnly: true, sameSite: "lax", secure: true, path: "/" , maxAge: SESSION_TTL_MS });
        const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
        authorizeUrl.searchParams.set("client_id", clientId);
        authorizeUrl.searchParams.set("redirect_uri", callbackUrl(req));
        authorizeUrl.searchParams.set("state", state);
        res.redirect(authorizeUrl.toString());
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start GitHub connection.";
        res.status(500).json({ error: message });
      }
    },
    callback: async (req: Request, res: Response) => {
      try {
        const code = typeof req.query.code === "string" ? req.query.code : "";
        const state = typeof req.query.state === "string" ? req.query.state : "";
        if (!code || !state) return res.status(400).json({ error: "GitHub authorization code and state are required." });
        if (!githubConnectStateMatches(req.headers.cookie, state)) return res.status(403).json({ error: "Invalid GitHub connection state." });
        res.clearCookie(GITHUB_CONNECT_STATE_COOKIE, { path: "/", secure: true, sameSite: "lax" });
        const session = await getGitHubConnectSession(state);
        if (!session || session.expiresAt <= new Date()) return res.status(400).json({ error: "GitHub connection session is missing or expired." });
        const userAccessToken = await exchangeGitHubUserCode({ code, redirectUri: callbackUrl(req) });
        const githubUser = await getGitHubAuthenticatedUser({ userAccessToken });
        const openId = `github:${githubUser.id}`;
        await upsertUser({ openId, name: githubUser.name ?? githubUser.login, email: githubUser.email ?? null, loginMethod: "github", lastSignedIn: new Date() });
        const user = await getUserByOpenId(openId);
        if (!user) throw new Error("Unable to create a local GitHub identity session.");
        const candidates = await listGitHubConnectCandidates({ userAccessToken });
        await saveGitHubConnectCandidates({ state, userId: user.id, candidatesJson: JSON.stringify(candidates) });
        const sessionToken = await sdk.createSessionToken(openId, { name: githubUser.name ?? githubUser.login, expiresInMs: ONE_YEAR_MS });
        res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
        res.redirect(`${originFor(req)}/connect/github?authorized=1`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to verify GitHub repository access.";
        res.status(500).json({ error: message });
      }
    },
  };
}
