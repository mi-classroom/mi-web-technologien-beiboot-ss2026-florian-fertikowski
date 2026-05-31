/**
 * Gesture types and contracts
 */

import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

/**
 * Discriminated union of all gesture events.
 */
export type GestureEvent =
  | {
      type: "pinch-start";
      handIndex: number;
      timestamp: number;
    }
  | {
      type: "pinch-end";
      handIndex: number;
      timestamp: number;
      durationMs: number;
    };

/**
 * Per-hand state exposed for UI feedback. The detector emits this
 * every frame so an overlay can show progress, position, etc.
 */
export interface PinchHandState {
  handIndex: number;
  phase: "idle" | "candidate" | "active";
  /**
   * 0..1 — for the candidate phase it represents dwell-time progress
   * (how close we are to firing the start event). In active phase it
   * stays at 1. In idle phase it stays at 0.
   */
  progress: number;
  /**
   * Position of the pinch midpoint (between thumb tip and index
   * tip)
   */
  position: { x: number; y: number };
}

export interface PinchDetectorState {
  hands: PinchHandState[];
}

/**
 * Per-frame output of a gesture detector
 *
 * The state shape is gesture-specific. e.g. Pinch returns
 * PinchDetectorState;
 */
export interface GestureUpdate {
  events: GestureEvent[];
  state?: unknown;
}

/**
 * Contract every gesture detector fulfils
 */
export interface GestureDetector {
  /**
   * Called once per frame with the latest hand-landmark result and
   * the current timestamp. Returns events that should fire this
   * frame plus optional UI state.
   */
  update(result: HandLandmarkerResult | null, timestamp: number): GestureUpdate;

  /** Resets internal state, e.g. when the camera disconnects. */
  reset(): void;
}
