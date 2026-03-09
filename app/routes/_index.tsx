import { TetrisView } from "~/components/tetris/TetrisView";
import { useTetris } from "~/lib/client/usecase/tetris/use-tetris";

import type { Route } from "./+types/_index";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Neon Stack Tetris" },
    {
      name: "description",
      content:
        "Responsive Tetris built as a React Router SPA with clean architecture, hold queue, ghost piece, and local high score storage.",
    },
  ];
}

export default function IndexRoute() {
  const tetris = useTetris();

  return <TetrisView {...tetris} />;
}
