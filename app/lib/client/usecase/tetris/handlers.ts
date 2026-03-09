export type TetrisKeyboardCommand =
  | "moveLeft"
  | "moveRight"
  | "softDrop"
  | "hardDrop"
  | "rotateClockwise"
  | "rotateCounterClockwise"
  | "holdPiece"
  | "pauseToggle"
  | "primaryAction"
  | "restart";

const KEYBOARD_COMMANDS: Record<string, TetrisKeyboardCommand> = {
  ArrowLeft: "moveLeft",
  KeyA: "moveLeft",
  ArrowRight: "moveRight",
  KeyD: "moveRight",
  ArrowDown: "softDrop",
  KeyS: "softDrop",
  ArrowUp: "rotateClockwise",
  KeyX: "rotateClockwise",
  KeyZ: "rotateCounterClockwise",
  Space: "hardDrop",
  KeyC: "holdPiece",
  ShiftLeft: "holdPiece",
  ShiftRight: "holdPiece",
  KeyP: "pauseToggle",
  Escape: "pauseToggle",
  Enter: "primaryAction",
  KeyR: "restart",
};

export function getKeyboardCommand(code: string): TetrisKeyboardCommand | null {
  return KEYBOARD_COMMANDS[code] ?? null;
}

export function shouldIgnoreKeyboardTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}
