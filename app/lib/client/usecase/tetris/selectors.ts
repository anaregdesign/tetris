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
};

const CONTROL_HINTS: TetrisControlHintViewModel[] = [
  { label: "Move", keys: "Arrow / A D" },
  { label: "Rotate", keys: "Up / X / Z" },
  { label: "Drop", keys: "Down / Space" },
  { label: "Hold", keys: "C / Shift" },
  { label: "Pause", keys: "P / Esc" },
  { label: "Restart", keys: "R" },
];

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

export function selectTetrisScreenViewModel(state: TetrisState): TetrisScreenViewModel {
  const phase = getPhase(state);
  const overlay = createOverlayCopy(phase);

  const heroContent: Record<
    TetrisPhase,
    { eyebrow: string; title: string; lead: string; statusLabel: string; statusCopy: string }
  > = {
    ready: {
      eyebrow: "Arcade SPA",
      title: "Neon Stack Tetris",
      lead:
        "A clean-architecture React Router SPA with a pure game engine, responsive controls, hold queue, ghost piece, and local best-score memory.",
      statusLabel: "Standby",
      statusCopy: "The board is primed. Start the run, then rotate aggressively before the skyline gets tight.",
    },
    running: {
      eyebrow: "Live Run",
      title: "Keep the skyline clean",
      lead:
        "Line clears accelerate the drop clock. Use hold tactically and watch the ghost guide for efficient hard drops.",
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
        "Top-out ends the run, but the stack history still tells you where the board drifted. Restart, compress the gaps, and beat the high score.",
      statusLabel: "Game Over",
      statusCopy: "Best score is preserved locally. Use the rematch button or R to relaunch immediately.",
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
  };
}
