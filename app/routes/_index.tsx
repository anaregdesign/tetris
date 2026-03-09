import { createServerDependencies } from "~/lib/server/infrastructure/dependencies.server";
import { isGitHubAuthConfigured } from "~/lib/server/infrastructure/env.server";
import { getSessionUserId } from "~/lib/server/infrastructure/session.server";
import { getHomeSnapshot } from "~/lib/server/usecase/tetris/get-home-snapshot.server";
import { TetrisView } from "~/components/tetris/TetrisView";
import { useTetris } from "~/lib/client/usecase/tetris/use-tetris";

import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Neon Stack Tetris" },
    {
      name: "description",
      content:
        "Responsive Tetris with GitHub social login, SQL Server score history, and a global leaderboard.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const viewerId = await getSessionUserId(request);
  const { playerRepository, scoreRunRepository } = createServerDependencies();

  return getHomeSnapshot({
    viewerId,
    githubConfigured: isGitHubAuthConfigured(),
    playerRepository,
    scoreRunRepository,
  });
}

export default function IndexRoute({ loaderData }: Route.ComponentProps) {
  const tetris = useTetris(loaderData);

  return <TetrisView {...tetris} />;
}
