import type { RecordScoreRunRequestDto } from "~/lib/contracts/tetris-dashboard";
import { createServerDependencies } from "~/lib/server/infrastructure/dependencies.server";
import { getSessionUserId } from "~/lib/server/infrastructure/session.server";
import { recordScoreRun } from "~/lib/server/usecase/tetris/record-score-run.server";

import type { Route } from "./+types/api.score-runs";

function parsePayload(formData: FormData): RecordScoreRunRequestDto {
  return {
    score: Number(formData.get("score")),
    lines: Number(formData.get("lines")),
    level: Number(formData.get("level")),
    durationMs: Number(formData.get("durationMs")),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const viewerId = await getSessionUserId(request);
  const { playerRepository, scoreRunRepository } = createServerDependencies();
  const result = await recordScoreRun({
    viewerId,
    payload: parsePayload(formData),
    playerRepository,
    scoreRunRepository,
  });

  return Response.json(result, {
    status: result.ok ? 201 : result.error.includes("Sign in") ? 401 : 400,
  });
}
