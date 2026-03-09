import type { TetrisDashboardDto } from "~/lib/contracts/tetris-dashboard";
import { BOARD_COLUMNS, BOARD_ROWS } from "~/lib/domain/entities/tetris-game";
import {
  getDropIntervalMs,
  projectGhostPiece,
} from "~/lib/domain/services/tetris-engine";
import {
  TETROMINO_LABELS,
  getTetrominoBlocks,
  getTetrominoPreviewMatrix,
  type TetrominoKind,
} from "~/lib/domain/value-objects/tetromino";

import type { TetrisState } from "./state";

export type TetrisPhase = "ready" | "running" | "paused" | "gameOver";

export type TetrisBoardCellViewModel = {
  key: string;
  tone: TetrominoKind | null;
  filled: boolean;
  ghost: boolean;
};

export type TetrisPreviewPieceViewModel = {
  tone: TetrominoKind;
  label: string;
  matrix: boolean[][];
};

export type TetrisControlHintViewModel = {
  label: string;
  keys: string;
};

export type TetrisRecentRunViewModel = {
  id: string;
  scoreLabel: string;
  detailLabel: string;
  recordedAtLabel: string;
  durationLabel: string;
};

export type TetrisLeaderboardEntryViewModel = {
  id: string;
  rankLabel: string;
  displayName: string;
  handleLabel: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  scoreLabel: string;
  detailLabel: string;
  highlighted: boolean;
};

export type ScoreSaveFeedback = {
  state: "guest" | "disabled" | "idle" | "saving" | "saved" | "error";
  canRetry: boolean;
  message?: string;
};

export type TetrisScreenViewModel = {
  phase: TetrisPhase;
  eyebrow: string;
  title: string;
  lead: string;
  statusLabel: string;
  statusCopy: string;
  score: number;
  highScore: number;
  level: number;
  lines: number;
  nextLevelProgress: number;
  tickIntervalMs: number;
  primaryActionLabel: string;
  secondaryActionLabel: string;
  boardCells: TetrisBoardCellViewModel[];
  holdPiece: TetrisPreviewPieceViewModel | null;
  nextPieces: TetrisPreviewPieceViewModel[];
  overlayTitle: string | null;
  overlayCopy: string | null;
  statusAnnouncement: string;
  controlHints: TetrisControlHintViewModel[];
  githubAuthConfigured: boolean;
  viewer: TetrisDashboardDto["auth"]["viewer"];
  signInHref: string;
  logoutAction: string;
  saveStatusLabel: string;
  saveStatusCopy: string;
  saveStatusTone: "neutral" | "progress" | "success" | "error";
  canRetrySave: boolean;
  recentRuns: TetrisRecentRunViewModel[];
  recentRunsEmptyTitle: string;
  recentRunsEmptyCopy: string;
  leaderboard: TetrisLeaderboardEntryViewModel[];
  leaderboardSummary: string;
  viewerRankLabel: string | null;
};

const CONTROL_HINTS: TetrisControlHintViewModel[] = [
  { label: "Move", keys: "Arrow / A D" },
  { label: "Rotate", keys: "Up / X / Z" },
  { label: "Drop", keys: "Down / Space" },
  { label: "Hold", keys: "C / Shift" },
  { label: "Pause", keys: "P / Esc" },
  { label: "Restart", keys: "R" },
];

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getPhase(state: TetrisState): TetrisPhase {
  return state.snapshot.gameOver ? "gameOver" : state.status;
}

function createPreviewPiece(tone: TetrominoKind): TetrisPreviewPieceViewModel {
  return {
    tone,
    label: TETROMINO_LABELS[tone],
    matrix: getTetrominoPreviewMatrix(tone),
  };
}

function createOverlayCopy(phase: TetrisPhase): { title: string | null; copy: string | null } {
  switch (phase) {
    case "ready":
      return {
        title: "Prime the skyline",
        copy: "Press Start Run or hit Enter. Space becomes hard drop once the round starts.",
      };
    case "paused":
      return {
        title: "Time freeze",
        copy: "Take a breath, inspect the stack, then resume when the landing spot is obvious.",
      };
    case "gameOver":
      return {
        title: "Stack collapsed",
        copy: "You still banked the score. Restart with R or the rematch button and chase a cleaner board.",
      };
    default:
      return {
        title: null,
        copy: null,
      };
  }
}

function createBoardCells(state: TetrisState): TetrisBoardCellViewModel[] {
  const phase = getPhase(state);
  const ghostPiece =
    phase === "running" || phase === "paused" ? projectGhostPiece(state.snapshot) : null;
  const activeCells = new Map<string, TetrominoKind>();
  const ghostCells = new Map<string, TetrominoKind>();

  const activePiece = state.snapshot.activePiece;

  if (ghostPiece !== null) {
    for (const block of projectBlocks(ghostPiece)) {
      ghostCells.set(`${block.row}:${block.col}`, ghostPiece.kind);
    }
  }

  if (activePiece !== null) {
    for (const block of projectBlocks(activePiece)) {
      activeCells.set(`${block.row}:${block.col}`, activePiece.kind);
      ghostCells.delete(`${block.row}:${block.col}`);
    }
  }

  const cells: TetrisBoardCellViewModel[] = [];

  for (let row = 0; row < BOARD_ROWS; row += 1) {
    for (let col = 0; col < BOARD_COLUMNS; col += 1) {
      const key = `${row}:${col}`;
      const activeTone = activeCells.get(key) ?? null;
      const lockedTone = state.snapshot.board[row][col];
      const ghostTone = ghostCells.get(key) ?? null;
      const tone = activeTone ?? lockedTone ?? ghostTone;

      cells.push({
        key,
        tone,
        filled: tone !== null && ghostTone === null,
        ghost: ghostTone !== null,
      });
    }
  }

  return cells;
}

function projectBlocks(piece: NonNullable<TetrisState["snapshot"]["activePiece"]>) {
  return getTetrominoBlocks(piece.kind, piece.rotation)
    .map((block) => ({
      row: piece.row + block.row,
      col: piece.col + block.col,
    }))
    .filter((block) => block.row >= 0);
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function createSaveStatus(
  saveFeedback: ScoreSaveFeedback,
  dashboard: TetrisDashboardDto,
): Pick<
  TetrisScreenViewModel,
  "saveStatusLabel" | "saveStatusCopy" | "saveStatusTone" | "canRetrySave"
> {
  switch (saveFeedback.state) {
    case "disabled":
      return {
        saveStatusLabel: "Auth Unavailable",
        saveStatusCopy:
          "GitHub OAuth env が未設定です。`.env` に client id / secret を入れると social login が有効になります。",
        saveStatusTone: "neutral",
        canRetrySave: false,
      };
    case "guest":
      return {
        saveStatusLabel: "Guest Run",
        saveStatusCopy:
          "GitHub でログインすると run が SQL Server に保存され、履歴と leaderboard に反映されます。",
        saveStatusTone: "neutral",
        canRetrySave: false,
      };
    case "saving":
      return {
        saveStatusLabel: "Saving Run",
        saveStatusCopy: "最後の run を SQL Server に保存して leaderboard を更新しています。",
        saveStatusTone: "progress",
        canRetrySave: false,
      };
    case "saved":
      return {
        saveStatusLabel: "Run Saved",
        saveStatusCopy:
          dashboard.auth.viewer === null
            ? "Run が保存されました。"
            : `${dashboard.auth.viewer.displayName} の履歴とランキングを更新しました。`,
        saveStatusTone: "success",
        canRetrySave: false,
      };
    case "error":
      return {
        saveStatusLabel: "Save Failed",
        saveStatusCopy:
          saveFeedback.message ??
          "SQL Server への保存に失敗しました。Retry で再送できます。",
        saveStatusTone: "error",
        canRetrySave: saveFeedback.canRetry,
      };
    default:
      return {
        saveStatusLabel: dashboard.auth.viewer ? "Signed In" : "Ready to Play",
        saveStatusCopy: dashboard.auth.viewer
          ? "Run 終了時に score が自動で保存されます。"
          : "まずは guest で遊べます。保存と競争には GitHub login が必要です。",
        saveStatusTone: "neutral",
        canRetrySave: false,
      };
  }
}

export function selectTetrisScreenViewModel(
  state: TetrisState,
  dashboard: TetrisDashboardDto,
  saveFeedback: ScoreSaveFeedback,
): TetrisScreenViewModel {
  const phase = getPhase(state);
  const overlay = createOverlayCopy(phase);
  const saveStatus = createSaveStatus(saveFeedback, dashboard);

  const heroContent: Record<
    TetrisPhase,
    { eyebrow: string; title: string; lead: string; statusLabel: string; statusCopy: string }
  > = {
    ready: {
      eyebrow: "Arcade SPA",
      title: "Neon Stack Tetris",
      lead:
        "A clean-architecture React Router app with a pure game engine, GitHub social login, SQL Server score history, and a live leaderboard.",
      statusLabel: "Standby",
      statusCopy: "The board is primed. Start the run, then rotate aggressively before the skyline gets tight.",
    },
    running: {
      eyebrow: "Live Run",
      title: "Keep the skyline clean",
      lead:
        "Line clears accelerate the drop clock. Finish the run cleanly and, if signed in, the result lands in your history and the global ranking.",
      statusLabel: "Flow State",
      statusCopy: "The interval tightens as your level climbs. Trust the queue, not panic inputs.",
    },
    paused: {
      eyebrow: "Tactical Pause",
      title: "Read the board again",
      lead:
        "This pause is intentional: scan the well, check your hold piece, and plan the next two bags before resuming.",
      statusLabel: "Paused",
      statusCopy: "Everything is frozen except the decision. Resume when you know exactly where the next commit lands.",
    },
    gameOver: {
      eyebrow: "After Action",
      title: "Run it back cleaner",
      lead:
        "Top-out ends the run, but the stack history still tells you where the board drifted. Restart, compress the gaps, and push a higher score into the ranking.",
      statusLabel: "Game Over",
      statusCopy: "If you are signed in, the finished run is recorded automatically. Use the rematch button or R to relaunch immediately.",
    },
  };

  return {
    phase,
    eyebrow: heroContent[phase].eyebrow,
    title: heroContent[phase].title,
    lead: heroContent[phase].lead,
    statusLabel: heroContent[phase].statusLabel,
    statusCopy: heroContent[phase].statusCopy,
    score: state.snapshot.score,
    highScore: state.highScore,
    level: state.snapshot.level,
    lines: state.snapshot.lines,
    nextLevelProgress: (state.snapshot.lines % 10) / 10,
    tickIntervalMs: getDropIntervalMs(state.snapshot.level),
    primaryActionLabel:
      phase === "running"
        ? "Pause Run"
        : phase === "paused"
          ? "Resume Run"
          : phase === "gameOver"
            ? "Start Rematch"
            : "Start Run",
    secondaryActionLabel: phase === "gameOver" ? "Reset Board" : "Fresh Bag",
    boardCells: createBoardCells(state),
    holdPiece: state.snapshot.holdPiece ? createPreviewPiece(state.snapshot.holdPiece) : null,
    nextPieces: state.snapshot.queue.slice(0, 5).map((kind) => createPreviewPiece(kind)),
    overlayTitle: overlay.title,
    overlayCopy: overlay.copy,
    statusAnnouncement: `${heroContent[phase].statusLabel}. Score ${state.snapshot.score}. Level ${state.snapshot.level}. Lines ${state.snapshot.lines}.`,
    controlHints: CONTROL_HINTS,
    githubAuthConfigured: dashboard.auth.githubConfigured,
    viewer: dashboard.auth.viewer,
    signInHref: "/auth/github",
    logoutAction: "/auth/logout",
    saveStatusLabel: saveStatus.saveStatusLabel,
    saveStatusCopy: saveStatus.saveStatusCopy,
    saveStatusTone: saveStatus.saveStatusTone,
    canRetrySave: saveStatus.canRetrySave,
    recentRuns: dashboard.recentRuns.map((run) => ({
      id: run.id,
      scoreLabel: run.score.toLocaleString(),
      detailLabel: `L${run.level} / ${run.lines.toLocaleString()} lines`,
      recordedAtLabel: dateFormatter.format(new Date(run.recordedAt)),
      durationLabel: formatDuration(run.durationMs),
    })),
    recentRunsEmptyTitle: dashboard.auth.viewer
      ? "まだ保存された run がありません"
      : "ログインすると履歴がここに出ます",
    recentRunsEmptyCopy: dashboard.auth.viewer
      ? "1 回でも game over まで遊べば、自動で score history が積み上がります。"
      : "GitHub で sign in すると、SQL Server に保存された自分の過去 run を時系列で見られます。",
    leaderboard: dashboard.leaderboard.map((entry) => ({
      id: `${entry.player.id}-${entry.rank}`,
      rankLabel: `#${entry.rank}`,
      displayName: entry.player.displayName,
      handleLabel: `@${entry.player.handle}`,
      avatarUrl: entry.player.avatarUrl,
      profileUrl: entry.player.profileUrl,
      scoreLabel: entry.score.toLocaleString(),
      detailLabel: `L${entry.level} / ${entry.lines.toLocaleString()} lines`,
      highlighted: entry.isViewer,
    })),
    leaderboardSummary:
      dashboard.totalPlayers > 0
        ? `${dashboard.totalPlayers.toLocaleString()} players have posted recorded runs.`
        : "No recorded runs yet. The first signed-in run sets the opening benchmark.",
    viewerRankLabel:
      dashboard.viewerRank === null ? null : `Global rank #${dashboard.viewerRank}`,
  };
}
