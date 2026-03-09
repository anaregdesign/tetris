import type { LeaderboardRun, ScoreRun, ScoreRunDraft } from "../entities/score-run";

export interface ScoreRunRepository {
  createForUser(userId: string, draft: ScoreRunDraft): Promise<ScoreRun>;
  listRecentByUser(userId: string, limit: number): Promise<ScoreRun[]>;
  getPersonalBest(userId: string): Promise<number>;
  getPersonalBestRank(userId: string): Promise<number | null>;
  listLeaderboard(limit: number, viewerId: string | null): Promise<LeaderboardRun[]>;
  countPlayersWithScores(): Promise<number>;
}
