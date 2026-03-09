export type ScoreRun = {
  id: string;
  userId: string;
  score: number;
  lines: number;
  level: number;
  durationMs: number;
  recordedAt: Date;
};

export type ScoreRunDraft = {
  score: number;
  lines: number;
  level: number;
  durationMs: number;
};

export type LeaderboardRun = {
  playerId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  score: number;
  lines: number;
  level: number;
  recordedAt: Date;
};

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function isRecordableScoreRun(draft: ScoreRunDraft): boolean {
  return (
    isNonNegativeInteger(draft.score) &&
    isNonNegativeInteger(draft.lines) &&
    Number.isInteger(draft.level) &&
    draft.level > 0 &&
    isNonNegativeInteger(draft.durationMs) &&
    draft.score > 0
  );
}
