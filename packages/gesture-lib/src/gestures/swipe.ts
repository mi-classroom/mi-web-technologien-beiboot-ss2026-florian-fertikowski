/**
 * Swipe gesture detector.
 *
 * Recognizes a deliberate horizontal hand movement as a discrete swipe-left or swipe-right event.
 * Distinguishes a real swipe from incidental hand motion via speed, straightness, horizontal dominance and relative distance.
 *
 */

import type { GestureDetector, GestureEvent, GestureUpdate } from "../types";

interface Landmark {
  x: number;
  y: number;
  z?: number;
}

interface HandResult {
  landmarks?: ReadonlyArray<ReadonlyArray<Landmark>>;
}

const WRIST = 0;
const MIDDLE_MCP = 9;

export interface SwipeOptions {
  /**
   * Length of the sliding window in milliseconds
   */
  bufferSizeMs?: number;
  /**
   * Minimum net horizontal displacement
   * wrist must travel at least x times its own hand length sideways
   */
  minDistanceHandLengths?: number;
  /**
   * Minimum average speed during the window
   */
  minSpeedHandLengthsPerSec?: number;
  /**
   * Path efficiency
   */
  minStraightness?: number;
  cooldownMs?: number;
  /** Optional override for the detector id. */
  id?: string;
}

interface BufferEntry {
  x: number;
  y: number;
  handLength: number;
  timestamp: number;
}

interface PerHandState {
  buffer: BufferEntry[];
  cooldownUntilMs: number;
}

export class SwipeGesture implements GestureDetector<unknown> {
  readonly id: string;
  readonly inputKind = "hands" as const;

  private readonly bufferSizeMs: number;
  private readonly minDistanceHandLengths: number;
  private readonly minSpeedHandLengthsPerSec: number;
  private readonly minStraightness: number;
  private readonly cooldownMs: number;
  private readonly handStates = new Map<number, PerHandState>();

  constructor(options: SwipeOptions = {}) {
    this.id = options.id ?? "swipe";
    this.bufferSizeMs = options.bufferSizeMs ?? 300;
    this.minDistanceHandLengths = options.minDistanceHandLengths ?? 0.6;
    this.minSpeedHandLengthsPerSec = options.minSpeedHandLengthsPerSec ?? 3.0;
    this.minStraightness = options.minStraightness ?? 0.7;
    this.cooldownMs = options.cooldownMs ?? 400;
  }

  update(input: unknown, timestamp: number): GestureUpdate {
    const result = input as HandResult | null;
    const events: GestureEvent[] = [];
    const hands = result?.landmarks ?? [];

    const seenIndices = new Set<number>();

    let bestCandidate: {
      handIndex: number;
      direction: "left" | "right";
      displacement: number;
    } | null = null;

    hands.forEach((hand, handIndex) => {
      seenIndices.add(handIndex);

      const wrist = hand[WRIST];
      const middleMcp = hand[MIDDLE_MCP];
      if (!wrist || !middleMcp) return;

      const handLength = distance2D(wrist, middleMcp);
      if (handLength < 1e-6) return;

      const state = this.getOrCreateState(handIndex);

      // Push current frame into the window, then prune old entries.
      state.buffer.push({
        x: wrist.x,
        y: wrist.y,
        handLength,
        timestamp,
      });
      const cutoff = timestamp - this.bufferSizeMs;
      while (state.buffer.length > 0 && state.buffer[0]!.timestamp < cutoff) {
        state.buffer.shift();
      }

      // Cooldown: ignore but keep updating the buffer.
      if (timestamp < state.cooldownUntilMs) return;

      // Need at least two frames to talk about motion.
      if (state.buffer.length < 2) return;

      const first = state.buffer[0]!;
      const last = state.buffer[state.buffer.length - 1]!;

      const dx = last.x - first.x;
      const dy = last.y - first.y;
      const duration = (last.timestamp - first.timestamp) / 1000;
      if (duration <= 0) return;

      // Normalize displacement and speed by a representative hand length
      const refHandLength = median(state.buffer.map((b) => b.handLength));
      if (refHandLength < 1e-6) return;

      const dxNormalized = Math.abs(dx) / refHandLength;
      const speedNormalized = dxNormalized / duration;

      // reject motion that is more vertical than horizontal
      if (Math.abs(dx) <= Math.abs(dy)) return;

      if (dxNormalized < this.minDistanceHandLengths) return;
      if (speedNormalized < this.minSpeedHandLengthsPerSec) return;

      // Straightness: net / total path length.
      let totalPath = 0;
      for (let i = 1; i < state.buffer.length; i++) {
        const a = state.buffer[i - 1]!;
        const b = state.buffer[i]!;
        const px = (b.x - a.x) / refHandLength;
        const py = (b.y - a.y) / refHandLength;
        totalPath += Math.sqrt(px * px + py * py);
      }
      if (totalPath < 1e-6) return;
      const straightness = dxNormalized / totalPath;
      if (straightness < this.minStraightness) return;

      // Candidate qualifies. Track the strongest one across hands.
      const direction: "left" | "right" = dx > 0 ? "right" : "left";
      if (bestCandidate === null || dxNormalized > bestCandidate.displacement) {
        bestCandidate = {
          handIndex,
          direction,
          displacement: dxNormalized,
        };
      }
    });

    if (bestCandidate !== null) {
      const candidate: {
        handIndex: number;
        direction: "left" | "right";
        displacement: number;
      } = bestCandidate;
      events.push({
        type: candidate.direction === "left" ? "swipe-left" : "swipe-right",
        handIndex: candidate.handIndex,
        timestamp,
      });

      // Clear buffer and set cooldown on ALL hands
      // Otherwise a simultaneous opposite-direction movement on the other
      // hand could fire as a second swipe.
      for (const state of this.handStates.values()) {
        state.buffer.length = 0;
        state.cooldownUntilMs = timestamp + this.cooldownMs;
      }
    }

    // Drop state for hands that disappeared.
    for (const handIndex of this.handStates.keys()) {
      if (!seenIndices.has(handIndex)) {
        this.handStates.delete(handIndex);
      }
    }

    return { events };
  }

  reset(): void {
    this.handStates.clear();
  }

  private getOrCreateState(handIndex: number): PerHandState {
    let state = this.handStates.get(handIndex);
    if (!state) {
      state = { buffer: [], cooldownUntilMs: 0 };
      this.handStates.set(handIndex, state);
    }
    return state;
  }
}

function distance2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}
