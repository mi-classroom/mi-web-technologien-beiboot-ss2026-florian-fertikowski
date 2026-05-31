/**
 * Pinch gesture detector.
 *
 * Recognizes thumb-tip touching index-tip as a deliberate gesture.
 *
 */

import type { HandLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import type {
  GestureDetector,
  GestureEvent,
  GestureUpdate,
  PinchHandState,
} from "./types";

/**
 * Tunable parameters. Defaults chosen during initial testing on a
 * 1280x720 stream; documented in observations.md and ADR-0006.
 */
export interface PinchDetectorOptions {
  /**
   * Relative distance below which the pinch is considered "engaged".
   */
  activateThreshold?: number;
  /**
   * Relative distance above which an active pinch is released.
   */
  deactivateThreshold?: number;
  /**
   * How long the activation condition must hold continuously before
   * firing pinch-start, in milliseconds. Filters out accidental
   * touches.
   */
  dwellTimeMs?: number;
  /**
   * EMA smoothing factor in [0,1]. Higher = more reactive, lower =
   * more stable
   */
  smoothingAlpha?: number;
}

interface PerHandState {
  phase: "idle" | "candidate" | "active";
  smoothedDistance: number | null;
  candidateSinceMs: number | null;
  activeSinceMs: number | null;
}

// MediaPipe hand landmark indices
const THUMB_TIP = 4;
const INDEX_TIP = 8;
const WRIST = 0;
const MIDDLE_MCP = 9;

export class PinchDetector implements GestureDetector {
  private readonly activateThreshold: number;
  private readonly deactivateThreshold: number;
  private readonly dwellTimeMs: number;
  private readonly smoothingAlpha: number;
  private readonly handStates = new Map<number, PerHandState>();

  constructor(options: PinchDetectorOptions = {}) {
    this.activateThreshold = options.activateThreshold ?? 0.3;
    this.deactivateThreshold = options.deactivateThreshold ?? 0.45;
    this.dwellTimeMs = options.dwellTimeMs ?? 200;
    this.smoothingAlpha = options.smoothingAlpha ?? 0.4;

    if (this.deactivateThreshold <= this.activateThreshold) {
      // Avoid flicker
      throw new Error(
        "deactivateThreshold must be > activateThreshold for hysteresis",
      );
    }
  }

  update(
    result: HandLandmarkerResult | null,
    timestamp: number,
  ): GestureUpdate {
    const events: GestureEvent[] = [];
    const handStates: PinchHandState[] = [];

    const hands = result?.landmarks ?? [];

    // Prune state for hands that disappeared this frame. Otherwise
    // a brief detection drop would leave stale "active" pinches
    // hanging in state forever.
    const seenIndices = new Set<number>();

    hands.forEach((hand, handIndex) => {
      seenIndices.add(handIndex);

      const relDistance = this.computeRelativeDistance(hand);
      if (relDistance === null) {
        // Required landmarks missing —> skip
        return;
      }

      const state = this.getOrCreateState(handIndex);

      // Smooth distance with EMA. First sample bypasses smoothing
      // to avoid a slow ramp from 0.
      state.smoothedDistance =
        state.smoothedDistance === null
          ? relDistance
          : state.smoothedDistance * (1 - this.smoothingAlpha) +
            relDistance * this.smoothingAlpha;

      const smoothed = state.smoothedDistance;

      // State machine
      // idle         (distance < activate)   -> candidate
      // candidate    (held for dwellTimeMs)  -> active
      // candidate    (distance > deactivate) -> idle
      // active       (distance > deactivate) -> idle
      let progress = 0;

      switch (state.phase) {
        case "idle":
          if (smoothed < this.activateThreshold) {
            state.phase = "candidate";
            state.candidateSinceMs = timestamp;
          }
          break;

        case "candidate": {
          if (smoothed > this.deactivateThreshold) {
            state.phase = "idle";
            state.candidateSinceMs = null;
            break;
          }
          const heldFor = timestamp - (state.candidateSinceMs ?? timestamp);
          progress = Math.min(1, heldFor / this.dwellTimeMs);
          if (heldFor >= this.dwellTimeMs) {
            state.phase = "active";
            state.activeSinceMs = timestamp;
            state.candidateSinceMs = null;
            events.push({
              type: "pinch-start",
              handIndex,
              timestamp,
            });
          }
          break;
        }

        case "active":
          if (smoothed > this.deactivateThreshold) {
            const durationMs = timestamp - (state.activeSinceMs ?? timestamp);
            state.phase = "idle";
            state.activeSinceMs = null;
            events.push({
              type: "pinch-end",
              handIndex,
              timestamp,
              durationMs,
            });
          } else {
            progress = 1;
          }
          break;
      }

      const thumb = hand[THUMB_TIP];
      const index = hand[INDEX_TIP];
      const position =
        thumb && index
          ? { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 }
          : { x: 0, y: 0 };

      handStates.push({
        handIndex,
        phase: state.phase,
        progress,
        position,
      });
    });

    // Drop state for hands no longer in frame
    for (const [handIndex, state] of this.handStates) {
      if (!seenIndices.has(handIndex)) {
        if (state.phase === "active") {
          events.push({
            type: "pinch-end",
            handIndex,
            timestamp,
            durationMs: timestamp - (state.activeSinceMs ?? timestamp),
          });
        }
        this.handStates.delete(handIndex);
      }
    }

    return {
      events,
      state: { hands: handStates },
    };
  }

  reset(): void {
    this.handStates.clear();
  }

  /**
   * Computes hand-size-invariant tip-to-tip distance
   */
  private computeRelativeDistance(
    landmarks: ReadonlyArray<Landmark>,
  ): number | null {
    const thumb = landmarks[THUMB_TIP];
    const index = landmarks[INDEX_TIP];
    const wrist = landmarks[WRIST];
    const middleMcp = landmarks[MIDDLE_MCP];

    if (!thumb || !index || !wrist || !middleMcp) return null;

    const tipDistance = distance3D(thumb, index);
    const referenceDistance = distance3D(wrist, middleMcp);

    if (referenceDistance < 1e-6) return null;

    return tipDistance / referenceDistance;
  }

  private getOrCreateState(handIndex: number): PerHandState {
    let state = this.handStates.get(handIndex);
    if (!state) {
      state = {
        phase: "idle",
        smoothedDistance: null,
        candidateSinceMs: null,
        activeSinceMs: null,
      };
      this.handStates.set(handIndex, state);
    }
    return state;
  }
}

/**
 * 3D Euclidean distance between two landmarks
 */
function distance3D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
