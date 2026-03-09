export type ViewerDto = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
};

export type ScoreRunDto = {
  id: string;
  score: number;
  lines: number;
  level: number;
  durationMs: number;
  recordedAt: string;
};

export type LeaderboardEntryDto = {
  rank: number;
  player: ViewerDto;
  score: number;
  lines: number;
  level: number;
  recordedAt: string;
  isViewer: boolean;
};

export type TetrisDashboardDto = {
  gameSeed: number;
  auth: {
    githubConfigured: boolean;
    viewer: ViewerDto | null;
  };
  recentRuns: ScoreRunDto[];
  personalBest: number;
  viewerRank: number | null;
  leaderboard: LeaderboardEntryDto[];
  totalPlayers: number;
};

export type RecordScoreRunRequestDto = {
  score: number;
  lines: number;
  level: number;
  durationMs: number;
};

export type RecordScoreRunResponseDto =
  | {
      ok: true;
      run: ScoreRunDto;
      personalBest: number;
      viewerRank: number | null;
    }
  | {
      ok: false;
      error: string;
    };
