import type { Rotation, TetrominoKind } from "../value-objects/tetromino";

export const BOARD_ROWS = 20;
export const BOARD_COLUMNS = 10;

export type BoardCell = TetrominoKind | null;
export type Board = BoardCell[][];

export type ActivePiece = {
  kind: TetrominoKind;
  rotation: Rotation;
  row: number;
  col: number;
};

export type GameSnapshot = {
  board: Board;
  activePiece: ActivePiece | null;
  queue: TetrominoKind[];
  holdPiece: TetrominoKind | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  rngSeed: number;
  gameOver: boolean;
};

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLUMNS }, () => null),
  );
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function createSpawnPiece(kind: TetrominoKind): ActivePiece {
  return {
    kind,
    rotation: 0,
    row: -1,
    col: 3,
  };
}
