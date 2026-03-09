import { redirectDocument } from "react-router";

import { completeGitHubSignIn } from "~/lib/server/usecase/auth/complete-github-sign-in.server";
import { createServerDependencies } from "~/lib/server/infrastructure/dependencies.server";
import { commitAuthSession, getAuthSession } from "~/lib/server/infrastructure/session.server";

import type { Route } from "./+types/auth.github.callback";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const session = await getAuthSession(request);
  const expectedState = session.get("githubOAuthState");

  if (!code || !state || !expectedState || state !== expectedState) {
    throw new Response("Invalid GitHub OAuth callback.", { status: 400 });
  }

  const { githubOAuthGateway, playerRepository } = createServerDependencies();

  if (githubOAuthGateway === null) {
    throw new Response("GitHub OAuth is not configured.", { status: 503 });
  }

  const player = await completeGitHubSignIn({
    code,
    redirectUri: new URL("/auth/github/callback", request.url).toString(),
    gateway: githubOAuthGateway,
    playerRepository,
  });

  session.unset("githubOAuthState");
  session.set("userId", player.id);

  return redirectDocument("/", {
    headers: {
      "Set-Cookie": await commitAuthSession(session),
    },
  });
}
