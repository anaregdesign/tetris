import type { LeaderboardRun, ScoreRun } from "~/lib/domain/entities/score-run";
import type { ScoreRunRepository } from "~/lib/domain/repositories/score-run-repository";

import type { PrismaClient } from "../generated/prisma/client";

function mapScoreRun(record: {
  id: string;
  userId: string;
  score: number;
  lines: number;
  level: number;
  durationMs: number;
  recordedAt: Date;
}): ScoreRun {
  return {
    id: record.id,
    userId: record.userId,
    score: record.score,
    lines: record.lines,
    level: record.level,
    durationMs: record.durationMs,
    recordedAt: record.recordedAt,
  };
}

export function createPrismaScoreRunRepository(
  prismaClient: PrismaClient,
): ScoreRunRepository {
  return {
    async createForUser(userId, draft) {
      const record = await prismaClient.scoreRun.create({
        data: {
          userId,
          score: draft.score,
          lines: draft.lines,
          level: draft.level,
          durationMs: draft.durationMs,
        },
        select: {
          id: true,
          userId: true,
          score: true,
          lines: true,
          level: true,
          durationMs: true,
          recordedAt: true,
        },
      });

      return mapScoreRun(record);
    },
    async listRecentByUser(userId, limit) {
      const records = await prismaClient.scoreRun.findMany({
        where: { userId },
        orderBy: { recordedAt: "desc" },
        take: limit,
        select: {
          id: true,
          userId: true,
          score: true,
          lines: true,
          level: true,
          durationMs: true,
          recordedAt: true,
        },
      });

      return records.map((record) => mapScoreRun(record));
    },
    async getPersonalBest(userId) {
      const result = await prismaClient.scoreRun.aggregate({
        where: { userId },
        _max: { score: true },
      });

      return result._max.score ?? 0;
    },
    async getPersonalBestRank(userId) {
      const groups = await prismaClient.scoreRun.groupBy({
        by: ["userId"],
        _max: { score: true },
      });

      const currentGroup = groups.find((group) => group.userId === userId);

      if (!currentGroup || currentGroup._max.score === null) {
        return null;
      }

      const currentBestScore = currentGroup._max.score;
      const rank =
        groups.filter((group) => (group._max.score ?? 0) > currentBestScore).length + 1;

      return rank;
    },
    async listLeaderboard(limit) {
      const groups = await prismaClient.scoreRun.groupBy({
        by: ["userId"],
        _max: {
          score: true,
        },
      });

      const topGroups = groups
        .filter((group) => group._max.score !== null)
        .sort((left, right) => (right._max.score ?? 0) - (left._max.score ?? 0))
        .slice(0, limit);

      const runs = await Promise.all(
        topGroups.map(async (group) => {
          const record = await prismaClient.scoreRun.findFirst({
            where: {
              userId: group.userId,
              score: group._max.score ?? 0,
            },
            orderBy: {
              recordedAt: "asc",
            },
            select: {
              score: true,
              lines: true,
              level: true,
              recordedAt: true,
              user: {
                select: {
                  id: true,
                  handle: true,
                  displayName: true,
                  avatarUrl: true,
                  profileUrl: true,
                },
              },
            },
          });

          if (record === null) {
            return null;
          }

          return {
            playerId: record.user.id,
            handle: record.user.handle,
            displayName: record.user.displayName,
            avatarUrl: record.user.avatarUrl,
            profileUrl: record.user.profileUrl,
            score: record.score,
            lines: record.lines,
            level: record.level,
            recordedAt: record.recordedAt,
          } satisfies LeaderboardRun;
        }),
      );

      return runs.filter((run): run is LeaderboardRun => run !== null);
    },
    async countPlayersWithScores() {
      const groups = await prismaClient.scoreRun.groupBy({
        by: ["userId"],
      });

      return groups.length;
    },
  };
}
