import {
  BOARD_COLUMNS,
  BOARD_ROWS,
  cloneBoard,
  createEmptyBoard,
  createSpawnPiece,
  type ActivePiece,
  type Board,
  type GameSnapshot,
} from "../entities/tetris-game";
import {
  TETROMINO_KINDS,
  getTetrominoBlocks,
  normalizeRotation,
  type BlockOffset,
  type TetrominoKind,
} from "../value-objects/tetromino";

const BASE_LINE_SCORES = [0, 100, 300, 500, 800] as const;

const NORMAL_ROTATION_TESTS: readonly BlockOffset[] = [
  { row: 0, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -2 },
  { row: 0, col: 2 },
];

const I_ROTATION_TESTS: readonly BlockOffset[] = [
  { row: 0, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 0, col: -2 },
  { row: 0, col: 2 },
  { row: -1, col: 0 },
  { row: 1, col: 0 },
];

function coerceSeed(seed: number): number {
  const nextSeed = seed >>> 0;

  return nextSeed === 0 ? 1 : nextSeed;
}

function nextRandom(seed: number): { seed: number; value: number } {
  const nextSeed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
  return {
    seed: coerceSeed(nextSeed),
    value: nextSeed / 4_294_967_296,
  };
}

function createShuffledBag(seed: number): {
  bag: TetrominoKind[];
  seed: number;
} {
  const bag = [...TETROMINO_KINDS];
  let nextSeed = coerceSeed(seed);

  for (let index = bag.length - 1; index > 0; index -= 1) {
    const random = nextRandom(nextSeed);
    nextSeed = random.seed;
    const swapIndex = Math.floor(random.value * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }

  return { bag, seed: nextSeed };
}

function hydrateQueue(snapshot: GameSnapshot, minimumLength = 7): GameSnapshot {
  let nextSnapshot = {
    ...snapshot,
    queue: [...snapshot.queue],
  };

  while (nextSnapshot.queue.length < minimumLength) {
    const refill = createShuffledBag(nextSnapshot.rngSeed);
    nextSnapshot = {
      ...nextSnapshot,
      queue: [...nextSnapshot.queue, ...refill.bag],
      rngSeed: refill.seed,
    };
  }

  return nextSnapshot;
}

function drawNextPiece(snapshot: GameSnapshot): {
  kind: TetrominoKind;
  snapshot: GameSnapshot;
} {
  const hydrated = hydrateQueue(snapshot, 1);
  const [kind, ...queue] = hydrated.queue;

  return {
    kind,
    snapshot: {
      ...hydrated,
      queue,
    },
  };
}

function getAbsoluteBlocks(piece: ActivePiece): BlockOffset[] {
  return getTetrominoBlocks(piece.kind, piece.rotation).map((block) => ({
    row: piece.row + block.row,
    col: piece.col + block.col,
  }));
}

function canPlacePiece(board: Board, piece: ActivePiece): boolean {
  return getAbsoluteBlocks(piece).every((block) => {
    if (block.col < 0 || block.col >= BOARD_COLUMNS || block.row >= BOARD_ROWS) {
      return false;
    }

    if (block.row < 0) {
      return true;
    }

    return board[block.row][block.col] === null;
  });
}

function mergeActivePiece(board: Board, piece: ActivePiece): { board: Board; topOut: boolean } {
  const nextBoard = cloneBoard(board);
  let topOut = false;

  for (const block of getAbsoluteBlocks(piece)) {
    if (block.row < 0) {
      topOut = true;
      continue;
    }

    nextBoard[block.row][block.col] = piece.kind;
  }

  return { board: nextBoard, topOut };
}

function clearCompletedRows(board: Board): { board: Board; clearedLines: number } {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null));
  const clearedLines = BOARD_ROWS - remainingRows.length;

  if (clearedLines === 0) {
    return { board, clearedLines };
  }

  const freshRows = Array.from({ length: clearedLines }, () =>
    Array.from({ length: BOARD_COLUMNS }, () => null),
  );

  return {
    board: [...freshRows, ...remainingRows],
    clearedLines,
  };
}

function getLineClearScore(clearedLines: number, level: number): number {
  const baseScore = BASE_LINE_SCORES[clearedLines] ?? BASE_LINE_SCORES[4];
  return baseScore * level;
}

function spawnFromQueue(snapshot: GameSnapshot, canHold = true): GameSnapshot {
  const draw = drawNextPiece(snapshot);
  const activePiece = createSpawnPiece(draw.kind);

  if (!canPlacePiece(draw.snapshot.board, activePiece)) {
    return {
      ...draw.snapshot,
      activePiece: null,
      canHold,
      gameOver: true,
    };
  }

  return {
    ...draw.snapshot,
    activePiece,
    canHold,
  };
}

function lockPiece(snapshot: GameSnapshot, extraScore = 0): GameSnapshot {
  if (snapshot.activePiece === null) {
    return snapshot;
  }

  const merged = mergeActivePiece(snapshot.board, snapshot.activePiece);
  const cleared = clearCompletedRows(merged.board);
  const nextLines = snapshot.lines + cleared.clearedLines;
  const nextLevel = Math.floor(nextLines / 10) + 1;
  const nextScore =
    snapshot.score + extraScore + getLineClearScore(cleared.clearedLines, snapshot.level);

  const nextSnapshot = {
    ...snapshot,
    board: cleared.board,
    activePiece: null,
    canHold: true,
    lines: nextLines,
    level: nextLevel,
    score: nextScore,
  };

  if (merged.topOut) {
    return {
      ...nextSnapshot,
      gameOver: true,
    };
  }

  return spawnFromQueue(nextSnapshot, true);
}

function withMovedPiece(
  snapshot: GameSnapshot,
  transform: (activePiece: ActivePiece) => ActivePiece,
): GameSnapshot {
  if (snapshot.activePiece === null || snapshot.gameOver) {
    return snapshot;
  }

  const nextPiece = transform(snapshot.activePiece);

  if (!canPlacePiece(snapshot.board, nextPiece)) {
    return snapshot;
  }

  return {
    ...snapshot,
    activePiece: nextPiece,
  };
}

export function createInitialSnapshot(seed: number): GameSnapshot {
  const baseSnapshot: GameSnapshot = {
    board: createEmptyBoard(),
    activePiece: null,
    queue: [],
    holdPiece: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    rngSeed: coerceSeed(seed),
    gameOver: false,
  };

  return spawnFromQueue(baseSnapshot, true);
}

export function getDropIntervalMs(level: number): number {
  return Math.max(110, 860 - (level - 1) * 58);
}

export function moveActivePiece(snapshot: GameSnapshot, deltaCol: number): GameSnapshot {
  return withMovedPiece(snapshot, (activePiece) => ({
    ...activePiece,
    col: activePiece.col + deltaCol,
  }));
}

export function rotateActivePiece(
  snapshot: GameSnapshot,
  direction: "cw" | "ccw",
): GameSnapshot {
  if (snapshot.activePiece === null || snapshot.gameOver) {
    return snapshot;
  }

  if (snapshot.activePiece.kind === "O") {
    return snapshot;
  }

  const nextRotation = normalizeRotation(
    snapshot.activePiece.rotation + (direction === "cw" ? 1 : -1),
  );
  const rotationTests =
    snapshot.activePiece.kind === "I" ? I_ROTATION_TESTS : NORMAL_ROTATION_TESTS;

  for (const test of rotationTests) {
    const candidate: ActivePiece = {
      ...snapshot.activePiece,
      rotation: nextRotation,
      row: snapshot.activePiece.row + test.row,
      col: snapshot.activePiece.col + test.col,
    };

    if (canPlacePiece(snapshot.board, candidate)) {
      return {
        ...snapshot,
        activePiece: candidate,
      };
    }
  }

  return snapshot;
}

export function advanceGame(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.activePiece === null || snapshot.gameOver) {
    return snapshot;
  }

  const fallenPiece = {
    ...snapshot.activePiece,
    row: snapshot.activePiece.row + 1,
  };

  if (canPlacePiece(snapshot.board, fallenPiece)) {
    return {
      ...snapshot,
      activePiece: fallenPiece,
    };
  }

  return lockPiece(snapshot);
}

export function softDropPiece(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.activePiece === null || snapshot.gameOver) {
    return snapshot;
  }

  const fallenPiece = {
    ...snapshot.activePiece,
    row: snapshot.activePiece.row + 1,
  };

  if (canPlacePiece(snapshot.board, fallenPiece)) {
    return {
      ...snapshot,
      activePiece: fallenPiece,
      score: snapshot.score + 1,
    };
  }

  return lockPiece(snapshot);
}

export function hardDropPiece(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.activePiece === null || snapshot.gameOver) {
    return snapshot;
  }

  let droppedPiece = snapshot.activePiece;
  let distance = 0;

  while (
    canPlacePiece(snapshot.board, {
      ...droppedPiece,
      row: droppedPiece.row + 1,
    })
  ) {
    droppedPiece = {
      ...droppedPiece,
      row: droppedPiece.row + 1,
    };
    distance += 1;
  }

  return lockPiece(
    {
      ...snapshot,
      activePiece: droppedPiece,
    },
    distance * 2,
  );
}

export function holdCurrentPiece(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.activePiece === null || snapshot.gameOver || !snapshot.canHold) {
    return snapshot;
  }

  if (snapshot.holdPiece === null) {
    return spawnFromQueue(
      {
        ...snapshot,
        activePiece: null,
        holdPiece: snapshot.activePiece.kind,
        canHold: false,
      },
      false,
    );
  }

  const swappedPiece = createSpawnPiece(snapshot.holdPiece);

  if (!canPlacePiece(snapshot.board, swappedPiece)) {
    return {
      ...snapshot,
      activePiece: null,
      holdPiece: snapshot.activePiece.kind,
      canHold: false,
      gameOver: true,
    };
  }

  return {
    ...snapshot,
    activePiece: swappedPiece,
    holdPiece: snapshot.activePiece.kind,
    canHold: false,
  };
}

export function projectGhostPiece(snapshot: GameSnapshot): ActivePiece | null {
  if (snapshot.activePiece === null || snapshot.gameOver) {
    return null;
  }

  let ghostPiece = snapshot.activePiece;

  while (
    canPlacePiece(snapshot.board, {
      ...ghostPiece,
      row: ghostPiece.row + 1,
    })
  ) {
    ghostPiece = {
      ...ghostPiece,
      row: ghostPiece.row + 1,
    };
  }

  return ghostPiece;
}
