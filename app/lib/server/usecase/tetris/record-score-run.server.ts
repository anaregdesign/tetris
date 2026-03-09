import type {
  RecordScoreRunRequestDto,
  RecordScoreRunResponseDto,
} from "~/lib/contracts/tetris-dashboard";
import { isRecordableScoreRun } from "~/lib/domain/entities/score-run";
import type { PlayerRepository } from "~/lib/domain/repositories/player-repository";
import type { ScoreRunRepository } from "~/lib/domain/repositories/score-run-repository";

type RecordScoreRunInput = {
  viewerId: string | null;
  payload: RecordScoreRunRequestDto;
  playerRepository: PlayerRepository;
  scoreRunRepository: ScoreRunRepository;
};

export async function recordScoreRun({
  viewerId,
  payload,
  playerRepository,
  scoreRunRepository,
}: RecordScoreRunInput): Promise<RecordScoreRunResponseDto> {
  if (viewerId === null) {
    return {
      ok: false,
      error: "Sign in with GitHub to save runs and compete on the leaderboard.",
    };
  }

  if (!isRecordableScoreRun(payload)) {
    return {
      ok: false,
      error: "The score payload is invalid.",
    };
  }

  const viewer = await playerRepository.findById(viewerId);

  if (viewer === null) {
    return {
      ok: false,
      error: "The signed-in player could not be found.",
    };
  }

  const run = await scoreRunRepository.createForUser(viewer.id, payload);
  const [personalBest, viewerRank] = await Promise.all([
    scoreRunRepository.getPersonalBest(viewer.id),
    scoreRunRepository.getPersonalBestRank(viewer.id),
  ]);

  return {
    ok: true,
    run: {
      id: run.id,
      score: run.score,
      lines: run.lines,
      level: run.level,
      durationMs: run.durationMs,
      recordedAt: run.recordedAt.toISOString(),
    },
    personalBest,
    viewerRank,
  };
}
