import { redirect } from "react-router";

import { createServerDependencies } from "~/lib/server/infrastructure/dependencies.server";
import { commitAuthSession, getAuthSession } from "~/lib/server/infrastructure/session.server";

import type { Route } from "./+types/auth.github";

export async function loader({ request }: Route.LoaderArgs) {
  const { githubOAuthGateway } = createServerDependencies();

  if (githubOAuthGateway === null) {
    throw new Response("GitHub OAuth is not configured.", { status: 503 });
  }

  const redirectUri = new URL("/auth/github/callback", request.url).toString();
  const state = crypto.randomUUID();
  const session = await getAuthSession(request);
  session.set("githubOAuthState", state);

  return redirect(githubOAuthGateway.createAuthorizationUrl({ redirectUri, state }), {
    headers: {
      "Set-Cookie": await commitAuthSession(session),
    },
  });
}
