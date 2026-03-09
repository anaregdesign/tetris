import {
  advanceGame,
  createInitialSnapshot,
  hardDropPiece,
  holdCurrentPiece,
  moveActivePiece,
  rotateActivePiece,
  softDropPiece,
} from "~/lib/domain/services/tetris-engine";

import type { TetrisState } from "./state";

export type TetrisAction =
  | { type: "startRequested" }
  | { type: "pauseToggled" }
  | { type: "restartRequested"; seed: number }
  | { type: "moveRequested"; deltaCol: number }
  | { type: "tickRequested" }
  | { type: "softDropRequested" }
  | { type: "hardDropRequested" }
  | { type: "rotateRequested"; direction: "cw" | "ccw" }
  | { type: "holdRequested" }
  | { type: "highScoreHydrated"; highScore: number };

function withSnapshot(state: TetrisState, snapshot: TetrisState["snapshot"]): TetrisState {
  return {
    ...state,
    snapshot,
    highScore: Math.max(state.highScore, snapshot.score),
  };
}

function applyActiveGame(
  state: TetrisState,
  transform: (snapshot: TetrisState["snapshot"]) => TetrisState["snapshot"],
): TetrisState {
  if (state.status !== "running" || state.snapshot.gameOver) {
    return state;
  }

  return withSnapshot(state, transform(state.snapshot));
}

export function tetrisReducer(state: TetrisState, action: TetrisAction): TetrisState {
  switch (action.type) {
    case "startRequested": {
      if (state.snapshot.gameOver) {
        return state;
      }

      return {
        ...state,
        status: "running",
      };
    }
    case "pauseToggled": {
      if (state.snapshot.gameOver || state.status === "ready") {
        return state;
      }

      return {
        ...state,
        status: state.status === "running" ? "paused" : "running",
      };
    }
    case "restartRequested":
      return {
        ...state,
        snapshot: createInitialSnapshot(action.seed),
        status: "running",
      };
    case "moveRequested":
      return applyActiveGame(state, (snapshot) => moveActivePiece(snapshot, action.deltaCol));
    case "tickRequested":
      return applyActiveGame(state, advanceGame);
    case "softDropRequested":
      return applyActiveGame(state, softDropPiece);
    case "hardDropRequested":
      return applyActiveGame(state, hardDropPiece);
    case "rotateRequested":
      return applyActiveGame(state, (snapshot) =>
        rotateActivePiece(snapshot, action.direction),
      );
    case "holdRequested":
      return applyActiveGame(state, holdCurrentPiece);
    case "highScoreHydrated":
      return {
        ...state,
        highScore: Math.max(state.highScore, action.highScore, state.snapshot.score),
      };
    default:
      return state;
  }
}
