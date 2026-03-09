import { describe, expect, it } from "vitest";

import type { PlayerRepository } from "~/lib/domain/repositories/player-repository";
import type { ScoreRunRepository } from "~/lib/domain/repositories/score-run-repository";

import { recordScoreRun } from "./record-score-run.server";

function createPlayerRepository(): PlayerRepository {
  return {
    async findById(id) {
      return {
        id,
        githubId: "42",
        handle: "piroyoung",
        displayName: "Hiroki",
        avatarUrl: null,
        profileUrl: null,
        email: null,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      };
    },
    async upsertGitHubIdentity(identity) {
      return {
        id: "viewer-1",
        githubId: identity.githubId,
        handle: identity.handle,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl,
        profileUrl: identity.profileUrl,
        email: identity.email,
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        updatedAt: new Date("2026-03-10T00:00:00.000Z"),
      };
    },
  };
}

function createScoreRunRepository(): ScoreRunRepository {
  return {
    async createForUser(userId, draft) {
      return {
        id: "run-1",
        userId,
        score: draft.score,
        lines: draft.lines,
        level: draft.level,
        durationMs: draft.durationMs,
        recordedAt: new Date("2026-03-10T12:00:00.000Z"),
      };
    },
    async listRecentByUser() {
      return [];
    },
    async getPersonalBest() {
      return 4800;
    },
    async getPersonalBestRank() {
      return 3;
    },
    async listLeaderboard() {
      return [];
    },
    async countPlayersWithScores() {
      return 1;
    },
  };
}

describe("recordScoreRun", () => {
  it("rejects unauthenticated submissions", async () => {
    const result = await recordScoreRun({
      viewerId: null,
      payload: {
        score: 1200,
        lines: 14,
        level: 3,
        durationMs: 90_000,
      },
      playerRepository: createPlayerRepository(),
      scoreRunRepository: createScoreRunRepository(),
    });

    expect(result.ok).toBe(false);
  });

  it("records a valid score for a signed-in player", async () => {
    const result = await recordScoreRun({
      viewerId: "viewer-1",
      payload: {
        score: 4800,
        lines: 32,
        level: 7,
        durationMs: 145_000,
      },
      playerRepository: createPlayerRepository(),
      scoreRunRepository: createScoreRunRepository(),
    });

    expect(result).toEqual({
      ok: true,
      run: {
        id: "run-1",
        score: 4800,
        lines: 32,
        level: 7,
        durationMs: 145_000,
        recordedAt: "2026-03-10T12:00:00.000Z",
      },
      personalBest: 4800,
      viewerRank: 3,
    });
  });

  it("rejects invalid payloads", async () => {
    const result = await recordScoreRun({
      viewerId: "viewer-1",
      payload: {
        score: 0,
        lines: 10,
        level: 2,
        durationMs: 40_000,
      },
      playerRepository: createPlayerRepository(),
      scoreRunRepository: createScoreRunRepository(),
    });

    expect(result.ok).toBe(false);
  });
});
