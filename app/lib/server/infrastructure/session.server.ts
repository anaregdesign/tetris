import { createCookieSessionStorage } from "react-router";

import { getSessionSecrets } from "./env.server";

type AuthSessionData = {
  userId?: string;
  githubOAuthState?: string;
};

const sessionStorage = createCookieSessionStorage<AuthSessionData>({
  cookie: {
    name: "__tetris_session",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: getSessionSecrets(),
    secure: process.env["NODE_ENV"] === "production",
    maxAge: 60 * 60 * 24 * 30,
  },
});

export async function getAuthSession(request: Request) {
  return sessionStorage.getSession(request.headers.get("Cookie"));
}

export async function commitAuthSession(session: Awaited<ReturnType<typeof getAuthSession>>) {
  return sessionStorage.commitSession(session);
}

export async function destroyAuthSession(session: Awaited<ReturnType<typeof getAuthSession>>) {
  return sessionStorage.destroySession(session);
}

export async function getSessionUserId(request: Request): Promise<string | null> {
  const session = await getAuthSession(request);
  return session.get("userId") ?? null;
}
