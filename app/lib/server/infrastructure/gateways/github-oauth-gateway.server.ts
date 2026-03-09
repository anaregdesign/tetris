import type { GitHubIdentity } from "~/lib/domain/entities/player-profile";
import type { GitHubOAuthGateway } from "~/lib/server/usecase/auth/github-oauth-gateway";

import { getGitHubAuthConfig } from "../env.server";

type GitHubUserResponse = {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string | null;
  html_url: string | null;
  email: string | null;
};

type GitHubEmailResponse = Array<{
  email: string;
  primary: boolean;
  verified: boolean;
}>;

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`GitHub OAuth request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

async function resolvePrimaryEmail(accessToken: string): Promise<string | null> {
  const response = await fetch("https://api.github.com/user/emails", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "anaregdesign-tetris",
    },
  });

  if (!response.ok) {
    return null;
  }

  const emails = (await response.json()) as GitHubEmailResponse;
  const primaryEmail = emails.find((email) => email.primary && email.verified);

  return primaryEmail?.email ?? null;
}

export function createGitHubOAuthGateway(): GitHubOAuthGateway {
  const config = getGitHubAuthConfig();

  return {
    createAuthorizationUrl({ redirectUri, state }) {
      const url = new URL("https://github.com/login/oauth/authorize");
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", "read:user user:email");
      url.searchParams.set("state", state);

      return url.toString();
    },
    async exchangeCodeForIdentity({ code, redirectUri }) {
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "anaregdesign-tetris",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokenPayload = await parseJson<{
        access_token?: string;
        error?: string;
      }>(tokenResponse);

      if (!tokenPayload.access_token) {
        throw new Error(tokenPayload.error ?? "GitHub did not return an access token.");
      }

      const userResponse = await fetch("https://api.github.com/user", {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${tokenPayload.access_token}`,
          "User-Agent": "anaregdesign-tetris",
        },
      });
      const user = await parseJson<GitHubUserResponse>(userResponse);
      const primaryEmail = user.email ?? (await resolvePrimaryEmail(tokenPayload.access_token));

      const identity: GitHubIdentity = {
        githubId: String(user.id),
        handle: user.login,
        displayName: user.name ?? user.login,
        avatarUrl: user.avatar_url,
        profileUrl: user.html_url,
        email: primaryEmail,
      };

      return identity;
    },
  };
}
