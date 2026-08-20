/**
 * Fist gesture — held to abort a running workout.
 *
 * This is a *consumer-defined* gesture: it lives entirely in
 * reha-vision, not in gesture-lib. It exists to test (and
 * demonstrate) the "Writing a custom gesture" path from the
 * library's README — built only against the public
 * `GestureDetector` interface and the exported `HAND_LANDMARKS`
 * constants, no access to library internals.
 *
 * Detection: the geometric inverse of Pause (all four non-thumb
 * fingers curled). Thumb position is intentionally unchecked, same
 * reasoning as PointingGesture in the library — people hold the
 * thumb differently when making a fist (tucked in vs. wrapped
 * over the fingers), and constraining it would exclude valid
 * poses.
 *
 * Unlike the library's Pause/Pinch, this gesture doesn't gate on
 * a short dwell time before firing `fist-start` — the app itself
 * runs a longer (multi-second) hold-to-confirm countdown after
 * `fist-start` fires, so a short dwell here would just add a
 * second, redundant delay. See the app's exit-confirmation dialog
 * for that logic.
 */

import type { GestureDetector, GestureEvent, GestureUpdate } from "gesture-lib";
import { HAND_LANDMARKS, FINGER_LANDMARKS } from "gesture-lib";

// Module augmentation: adds "fist-start" / "fist-end" as valid,
// type-safe event types on the recognizer's `on()` method. This
// is the extension mechanism documented in the library README.
declare module "gesture-lib" {
  interface CustomGestureEventMap {
    "fist-start": FistStartEvent;
    "fist-end": FistEndEvent;
  }
}

export interface FistStartEvent {
  type: "fist-start";
  handIndex: number;
  timestamp: number;
}

export interface FistEndEvent {
  type: "fist-end";
  handIndex: number;
  timestamp: number;
  durationMs: number;
}

interface Landmark {
  x: number;
  y: number;
  z?: number;
}

interface HandResult {
  landmarks?: ReadonlyArray<ReadonlyArray<Landmark>>;
}

export interface FistOptions {
  /** Curl threshold (tip-to-MCP distance over hand length) for a
   *  finger to count as "curled" during activation. Strict. */
  activateCurledThreshold?: number;
  /** Looser threshold for staying curled once active (hysteresis). */
  releaseCurledThreshold?: number;
  /** How long the fist must hold before fist-start fires. Kept
   *  short — the app's own multi-second countdown is the real
   *  "are you sure" gate, this is just basic-jitter debounce. */
  dwellTimeMs?: number;
  id?: string;
}

interface ActiveState {
  handIndex: number;
  phase: "candidate" | "active";
  candidateSinceMs: number | null;
  activeSinceMs: number | null;
}

function distance2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function handLength(hand: ReadonlyArray<Landmark>): number | null {
  const wrist = hand[HAND_LANDMARKS.WRIST];
  const mcp = hand[HAND_LANDMARKS.MIDDLE_MCP];
  if (!wrist || !mcp) return null;
  const d = distance2D(wrist, mcp);
  return d < 1e-6 ? null : d;
}

function isFingerCurled(
  hand: ReadonlyArray<Landmark>,
  finger: keyof typeof FINGER_LANDMARKS,
  threshold: number,
): boolean {
  const { tip, mcp } = FINGER_LANDMARKS[finger];
  const tipLm = hand[tip];
  const mcpLm = hand[mcp];
  if (!tipLm || !mcpLm) return false;
  const hl = handLength(hand);
  if (hl === null) return false;
  return distance2D(tipLm, mcpLm) / hl < threshold;
}

export class FistGesture implements GestureDetector<unknown> {
  readonly id: string;
  readonly inputKind = "hands" as const;

  private readonly activateThreshold: number;
  private readonly releaseThreshold: number;
  private readonly dwellTimeMs: number;
  private current: ActiveState | null = null;

  constructor(options: FistOptions = {}) {
    this.id = options.id ?? "fist";
    this.activateThreshold = options.activateCurledThreshold ?? 0.45;
    this.releaseThreshold = options.releaseCurledThreshold ?? 0.6;
    this.dwellTimeMs = options.dwellTimeMs ?? 150;

    if (this.releaseThreshold <= this.activateThreshold) {
      throw new Error(
        "FistGesture: releaseCurledThreshold must be greater than activateCurledThreshold",
      );
    }
  }

  update(input: unknown, timestamp: number): GestureUpdate {
    const result = input as HandResult | null;
    const events: GestureEvent[] = [];
    const hands = result?.landmarks ?? [];

    if (this.current !== null) {
      const hand = hands[this.current.handIndex];
      const stillFist = hand ? this.isFistRelease(hand) : false;

      if (!stillFist) {
        if (this.current.phase === "active") {
          events.push({
            type: "fist-end",
            handIndex: this.current.handIndex,
            timestamp,
            durationMs: timestamp - (this.current.activeSinceMs ?? timestamp),
          });
        }
        this.current = null;
      } else if (this.current.phase === "candidate") {
        const heldFor =
          timestamp - (this.current.candidateSinceMs ?? timestamp);
        if (heldFor >= this.dwellTimeMs) {
          this.current.phase = "active";
          this.current.activeSinceMs = timestamp;
          this.current.candidateSinceMs = null;
          events.push({
            type: "fist-start",
            handIndex: this.current.handIndex,
            timestamp,
          });
        }
      }
    }

    if (this.current === null) {
      for (let i = 0; i < hands.length; i++) {
        const hand = hands[i]!;
        if (this.isFistActivate(hand)) {
          this.current = {
            handIndex: i,
            phase: "candidate",
            candidateSinceMs: timestamp,
            activeSinceMs: null,
          };
          break;
        }
      }
    }

    return { events };
  }

  reset(): void {
    this.current = null;
  }

  private isFistActivate(hand: ReadonlyArray<Landmark>): boolean {
    return this.allFingersCurled(hand, this.activateThreshold);
  }

  private isFistRelease(hand: ReadonlyArray<Landmark>): boolean {
    return this.allFingersCurled(hand, this.releaseThreshold);
  }

  private allFingersCurled(
    hand: ReadonlyArray<Landmark>,
    threshold: number,
  ): boolean {
    const fingers: Array<keyof typeof FINGER_LANDMARKS> = [
      "index",
      "middle",
      "ring",
      "pinky",
    ];
    for (const finger of fingers) {
      if (!isFingerCurled(hand, finger, threshold)) return false;
    }
    return true;
  }
}
