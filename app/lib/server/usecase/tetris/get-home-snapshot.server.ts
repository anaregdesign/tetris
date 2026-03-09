import type { TetrisDashboardDto } from "~/lib/contracts/tetris-dashboard";
import type { PlayerRepository } from "~/lib/domain/repositories/player-repository";
import type { ScoreRunRepository } from "~/lib/domain/repositories/score-run-repository";

type GetHomeSnapshotInput = {
  viewerId: string | null;
  githubConfigured: boolean;
  playerRepository: PlayerRepository;
  scoreRunRepository: ScoreRunRepository;
};

export async function getHomeSnapshot({
  viewerId,
  githubConfigured,
  playerRepository,
  scoreRunRepository,
}: GetHomeSnapshotInput): Promise<TetrisDashboardDto> {
  const [viewer, leaderboard, totalPlayers] = await Promise.all([
    viewerId ? playerRepository.findById(viewerId) : Promise.resolve(null),
    scoreRunRepository.listLeaderboard(10, viewerId),
    scoreRunRepository.countPlayersWithScores(),
  ]);

  if (viewer === null) {
    return {
      gameSeed: Date.now(),
      auth: {
        githubConfigured,
        viewer: null,
      },
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        player: {
          id: entry.playerId,
          handle: entry.handle,
          displayName: entry.displayName,
          avatarUrl: entry.avatarUrl,
          profileUrl: entry.profileUrl,
        },
        score: entry.score,
        lines: entry.lines,
        level: entry.level,
        recordedAt: entry.recordedAt.toISOString(),
        isViewer: false,
      })),
      personalBest: 0,
      recentRuns: [],
      totalPlayers,
      viewerRank: null,
    };
  }

  const [recentRuns, personalBest, viewerRank] = await Promise.all([
    scoreRunRepository.listRecentByUser(viewer.id, 8),
    scoreRunRepository.getPersonalBest(viewer.id),
    scoreRunRepository.getPersonalBestRank(viewer.id),
  ]);

  return {
    gameSeed: Date.now(),
    auth: {
      githubConfigured,
      viewer: {
        id: viewer.id,
        handle: viewer.handle,
        displayName: viewer.displayName,
        avatarUrl: viewer.avatarUrl,
        profileUrl: viewer.profileUrl,
      },
    },
    leaderboard: leaderboard.map((entry, index) => ({
      rank: index + 1,
      player: {
        id: entry.playerId,
        handle: entry.handle,
        displayName: entry.displayName,
        avatarUrl: entry.avatarUrl,
        profileUrl: entry.profileUrl,
      },
      score: entry.score,
      lines: entry.lines,
      level: entry.level,
      recordedAt: entry.recordedAt.toISOString(),
      isViewer: entry.playerId === viewer.id,
    })),
    personalBest,
    recentRuns: recentRuns.map((run) => ({
      id: run.id,
      score: run.score,
      lines: run.lines,
      level: run.level,
      durationMs: run.durationMs,
      recordedAt: run.recordedAt.toISOString(),
    })),
    totalPlayers,
    viewerRank,
  };
}
