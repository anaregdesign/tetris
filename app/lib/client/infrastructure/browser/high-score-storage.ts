const HIGH_SCORE_STORAGE_KEY = "tetris.high-score";

function hasBrowserStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadHighScore(): number {
  if (!hasBrowserStorage()) {
    return 0;
  }

  const rawValue = window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY);

  if (rawValue === null) {
    return 0;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function saveHighScore(score: number): void {
  if (!hasBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(Math.max(0, score)));
}
