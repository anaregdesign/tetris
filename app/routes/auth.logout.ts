import { redirectDocument } from "react-router";

import { destroyAuthSession, getAuthSession } from "~/lib/server/infrastructure/session.server";

import type { Route } from "./+types/auth.logout";

export async function action({ request }: Route.ActionArgs) {
  const session = await getAuthSession(request);

  return redirectDocument("/", {
    headers: {
      "Set-Cookie": await destroyAuthSession(session),
    },
  });
}
