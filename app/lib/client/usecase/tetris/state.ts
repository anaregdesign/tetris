import { createInitialSnapshot } from "~/lib/domain/services/tetris-engine";
import type { GameSnapshot } from "~/lib/domain/entities/tetris-game";

export type TetrisStatus = "ready" | "running" | "paused";

export type TetrisState = {
  snapshot: GameSnapshot;
  status: TetrisStatus;
  highScore: number;
};

export function createInitialState(seed: number): TetrisState {
  return {
    snapshot: createInitialSnapshot(seed),
    status: "ready",
    highScore: 0,
  };
}
