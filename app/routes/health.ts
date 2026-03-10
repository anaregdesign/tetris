import { data } from "react-router";

import type { Route } from "./+types/health";

export function loader(_: Route.LoaderArgs) {
  return data(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
