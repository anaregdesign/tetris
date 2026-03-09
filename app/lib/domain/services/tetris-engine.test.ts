import { describe, expect, it } from "vitest";

import {
  createEmptyBoard,
  type GameSnapshot,
} from "../entities/tetris-game";
import {
  createInitialSnapshot,
  hardDropPiece,
  holdCurrentPiece,
} from "./tetris-engine";

describe("tetris-engine", () => {
  it("creates a playable opening snapshot", () => {
    const snapshot = createInitialSnapshot(42);

    expect(snapshot.activePiece).not.toBeNull();
    expect(snapshot.queue.length).toBeGreaterThanOrEqual(6);
    expect(snapshot.level).toBe(1);
    expect(snapshot.gameOver).toBe(false);
  });

  it("clears lines and advances the queue when a piece locks", () => {
    const board = createEmptyBoard();

    for (let column = 0; column < 8; column += 1) {
      board[18][column] = "J";
      board[19][column] = "L";
    }

    const snapshot: GameSnapshot = {
      board,
      activePiece: {
        kind: "O",
        rotation: 0,
        row: 18,
        col: 7,
      },
      queue: ["I", "T", "S"],
      holdPiece: null,
      canHold: true,
      score: 0,
      lines: 0,
      level: 1,
      rngSeed: 11,
      gameOver: false,
    };

    const nextSnapshot = hardDropPiece(snapshot);

    expect(nextSnapshot.lines).toBe(2);
    expect(nextSnapshot.score).toBe(300);
    expect(nextSnapshot.activePiece?.kind).toBe("I");
    expect(nextSnapshot.board[19].every((cell) => cell === null)).toBe(true);
  });

  it("allows one hold action until the active piece locks", () => {
    const snapshot = createInitialSnapshot(12);
    const heldSnapshot = holdCurrentPiece(snapshot);

    expect(heldSnapshot.holdPiece).toBe(snapshot.activePiece?.kind ?? null);
    expect(heldSnapshot.canHold).toBe(false);
    expect(heldSnapshot.activePiece?.kind).not.toBe(snapshot.activePiece?.kind);

    const repeatedHold = holdCurrentPiece(heldSnapshot);
    expect(repeatedHold).toEqual(heldSnapshot);
  });
});
