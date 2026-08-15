// ---------------------------------------------------------------------------
// Haptics — thin wrapper over navigator.vibrate, gated by settings.
// ---------------------------------------------------------------------------

export type HapticKind =
  | "click"
  | "start"
  | "stop"
  | "launch"
  | "impact"
  | "success"
  | "error"
  | "tick";

const PATTERNS: Record<HapticKind, number[]> = {
  click: [8],
  start: [20, 40, 20],
  stop: [12],
  launch: [30, 50, 30, 50, 30],
  impact: [60],
  success: [20, 30, 20, 30, 40],
  error: [40, 60, 40],
  tick: [6],
};

export function vibrate(kind: HapticKind, enabled: boolean): void {
  if (!enabled) return;
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(PATTERNS[kind]);
    }
  } catch {
    /* unsupported — continue without haptics */
  }
}
