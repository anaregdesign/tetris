import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useReducer,
} from "react";
import { useFetcher, useRevalidator } from "react-router";

import type {
  RecordScoreRunRequestDto,
  RecordScoreRunResponseDto,
  TetrisDashboardDto,
} from "~/lib/contracts/tetris-dashboard";

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
  type ScoreSaveFeedback,
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
  handleRetryScoreSave(): void;
};

function createSeed(): number {
  return Date.now();
}

function createRunPayload(
  score: number,
  lines: number,
  level: number,
  durationMs: number,
): RecordScoreRunRequestDto {
  return {
    score,
    lines,
    level,
    durationMs,
  };
}

export function useTetris(
  dashboard: TetrisDashboardDto,
): TetrisScreenViewModel & TetrisScreenHandlers {
  const scoreRunFetcher = useFetcher<RecordScoreRunResponseDto>();
  const revalidator = useRevalidator();
  const [state, dispatch] = useReducer(
    tetrisReducer,
    undefined,
    () => createInitialState(dashboard.gameSeed, dashboard.personalBest),
  );
  const runStartedAtMsRef = useRef<number | null>(null);
  const previousGameOverRef = useRef(false);
  const lastFinishedRunRef = useRef<RecordScoreRunRequestDto | null>(null);
  const lastSubmittedRunKeyRef = useRef<string | null>(null);
  const lastRevalidatedRunIdRef = useRef<string | null>(null);

  const submitScoreRun = useEffectEvent((payload: RecordScoreRunRequestDto) => {
    const formData = new FormData();
    formData.set("score", String(payload.score));
    formData.set("lines", String(payload.lines));
    formData.set("level", String(payload.level));
    formData.set("durationMs", String(payload.durationMs));
    scoreRunFetcher.submit(formData, {
      action: "/api/score-runs",
      method: "post",
    });
  });

  const saveFeedback: ScoreSaveFeedback = dashboard.auth.viewer
    ? scoreRunFetcher.state !== "idle"
      ? { state: "saving", canRetry: false }
      : scoreRunFetcher.data?.ok
        ? { state: "saved", canRetry: false }
        : scoreRunFetcher.data && !scoreRunFetcher.data.ok
          ? {
              state: "error",
              canRetry: lastFinishedRunRef.current !== null,
              message: scoreRunFetcher.data.error,
            }
          : { state: "idle", canRetry: false }
    : dashboard.auth.githubConfigured
      ? { state: "guest", canRetry: false }
      : { state: "disabled", canRetry: false };

  const viewModel = selectTetrisScreenViewModel(state, dashboard, saveFeedback);

  const handleRestart = useEffectEvent(() => {
    runStartedAtMsRef.current = Date.now();
    previousGameOverRef.current = false;
    lastFinishedRunRef.current = null;
    lastSubmittedRunKeyRef.current = null;

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
      if (state.status === "ready") {
        runStartedAtMsRef.current = Date.now();
      }

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
    const nextHighScore = dashboard.auth.viewer
      ? dashboard.personalBest
      : loadHighScore();

    dispatch({ type: "highScoreHydrated", highScore: nextHighScore });
  }, [dashboard.auth.viewer, dashboard.personalBest]);

  useEffect(() => {
    if (!dashboard.auth.viewer && state.highScore > 0) {
      saveHighScore(state.highScore);
    }
  }, [dashboard.auth.viewer, state.highScore]);

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

  useEffect(() => {
    if (!dashboard.auth.viewer) {
      previousGameOverRef.current = state.snapshot.gameOver;
      return;
    }

    const justFinished = state.snapshot.gameOver && !previousGameOverRef.current;
    previousGameOverRef.current = state.snapshot.gameOver;

    if (!justFinished || state.snapshot.score <= 0) {
      return;
    }

    const durationMs = Math.max(
      0,
      runStartedAtMsRef.current === null ? 0 : Date.now() - runStartedAtMsRef.current,
    );
    const payload = createRunPayload(
      state.snapshot.score,
      state.snapshot.lines,
      state.snapshot.level,
      durationMs,
    );
    const runKey = `${payload.score}:${payload.lines}:${payload.level}:${payload.durationMs}`;

    lastFinishedRunRef.current = payload;

    if (lastSubmittedRunKeyRef.current === runKey) {
      return;
    }

    lastSubmittedRunKeyRef.current = runKey;
    submitScoreRun(payload);
  }, [
    dashboard.auth.viewer,
    state.snapshot.gameOver,
    state.snapshot.level,
    state.snapshot.lines,
    state.snapshot.score,
    submitScoreRun,
  ]);

  useEffect(() => {
    if (scoreRunFetcher.state !== "idle" || !scoreRunFetcher.data?.ok) {
      return;
    }

    if (lastRevalidatedRunIdRef.current === scoreRunFetcher.data.run.id) {
      return;
    }

    lastRevalidatedRunIdRef.current = scoreRunFetcher.data.run.id;
    revalidator.revalidate();
  }, [revalidator, scoreRunFetcher.data, scoreRunFetcher.state]);

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

  const handleRetryScoreSave = useEffectEvent(() => {
    if (lastFinishedRunRef.current === null) {
      return;
    }

    submitScoreRun(lastFinishedRunRef.current);
  });

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
    handleRetryScoreSave,
  };
}
