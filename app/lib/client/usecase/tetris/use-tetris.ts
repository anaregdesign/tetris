import {
  startTransition,
  useEffect,
  useEffectEvent,
  useReducer,
} from "react";

import {
  loadHighScore,
  saveHighScore,
} from "~/lib/client/infrastructure/browser/high-score-storage";

import {
  getKeyboardCommand,
  shouldIgnoreKeyboardTarget,
} from "./handlers";
import { tetrisReducer } from "./reducer";
import {
  selectTetrisScreenViewModel,
  type TetrisScreenViewModel,
} from "./selectors";
import { createInitialState } from "./state";

export type TetrisScreenHandlers = {
  handlePrimaryAction(): void;
  handleRestart(): void;
  handlePauseToggle(): void;
  handleMoveLeft(): void;
  handleMoveRight(): void;
  handleRotateClockwise(): void;
  handleRotateCounterClockwise(): void;
  handleSoftDrop(): void;
  handleHardDrop(): void;
  handleHoldPiece(): void;
};

function createSeed(): number {
  return Date.now();
}

export function useTetris(): TetrisScreenViewModel & TetrisScreenHandlers {
  const [state, dispatch] = useReducer(
    tetrisReducer,
    undefined,
    () => createInitialState(createSeed()),
  );

  const viewModel = selectTetrisScreenViewModel(state);

  const handleRestart = useEffectEvent(() => {
    startTransition(() => {
      dispatch({ type: "restartRequested", seed: createSeed() });
    });
  });

  const handlePrimaryAction = useEffectEvent(() => {
    if (state.snapshot.gameOver) {
      handleRestart();
      return;
    }

    if (state.status === "running") {
      dispatch({ type: "pauseToggled" });
      return;
    }

    if (state.status === "paused" || state.status === "ready") {
      dispatch({ type: "startRequested" });
    }
  });

  const handlePauseToggle = useEffectEvent(() => {
    dispatch({ type: "pauseToggled" });
  });

  const handleMoveLeft = useEffectEvent(() => {
    dispatch({ type: "moveRequested", deltaCol: -1 });
  });

  const handleMoveRight = useEffectEvent(() => {
    dispatch({ type: "moveRequested", deltaCol: 1 });
  });

  const handleRotateClockwise = useEffectEvent(() => {
    dispatch({ type: "rotateRequested", direction: "cw" });
  });

  const handleRotateCounterClockwise = useEffectEvent(() => {
    dispatch({ type: "rotateRequested", direction: "ccw" });
  });

  const handleSoftDrop = useEffectEvent(() => {
    dispatch({ type: "softDropRequested" });
  });

  const handleHardDrop = useEffectEvent(() => {
    dispatch({ type: "hardDropRequested" });
  });

  const handleHoldPiece = useEffectEvent(() => {
    dispatch({ type: "holdRequested" });
  });

  const tick = useEffectEvent(() => {
    dispatch({ type: "tickRequested" });
  });

  useEffect(() => {
    dispatch({ type: "highScoreHydrated", highScore: loadHighScore() });
  }, []);

  useEffect(() => {
    if (state.highScore > 0) {
      saveHighScore(state.highScore);
    }
  }, [state.highScore]);

  useEffect(() => {
    if (state.status !== "running" || state.snapshot.gameOver) {
      return;
    }

    const timer = window.setInterval(() => {
      tick();
    }, viewModel.tickIntervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [state.status, state.snapshot.gameOver, viewModel.tickIntervalMs, tick]);

  const handleKeyboard = useEffectEvent((event: KeyboardEvent) => {
    if (shouldIgnoreKeyboardTarget(event.target)) {
      return;
    }

    const command = getKeyboardCommand(event.code);

    if (command === null) {
      return;
    }

    event.preventDefault();

    switch (command) {
      case "primaryAction":
        handlePrimaryAction();
        break;
      case "pauseToggle":
        handlePauseToggle();
        break;
      case "restart":
        handleRestart();
        break;
      case "moveLeft":
        handleMoveLeft();
        break;
      case "moveRight":
        handleMoveRight();
        break;
      case "softDrop":
        handleSoftDrop();
        break;
      case "hardDrop":
        if (state.status === "ready") {
          handlePrimaryAction();
          break;
        }
        handleHardDrop();
        break;
      case "rotateClockwise":
        handleRotateClockwise();
        break;
      case "rotateCounterClockwise":
        handleRotateCounterClockwise();
        break;
      case "holdPiece":
        handleHoldPiece();
        break;
      default:
        break;
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [handleKeyboard]);

  return {
    ...viewModel,
    handlePrimaryAction,
    handleRestart,
    handlePauseToggle,
    handleMoveLeft,
    handleMoveRight,
    handleRotateClockwise,
    handleRotateCounterClockwise,
    handleSoftDrop,
    handleHardDrop,
    handleHoldPiece,
  };
}
