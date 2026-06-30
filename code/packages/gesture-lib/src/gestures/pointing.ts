/**
 * Pointing gesture detector.
 *
 * Recognises a deliberate pointing pose — index finger extended,
 * middle/ring/pinky curled — and emits a continuous cursor stream
 * while the pose is held.
 */

import type {
    GestureDetector,
    GestureEvent,
    GestureUpdate,
} from "../types";
import {
    type Landmark,
    type FingerName,
    isFingerExtended,
    isFingerCurled,
} from "../utils/finger-postures";

interface HandResult {
    landmarks?: ReadonlyArray<ReadonlyArray<Landmark>>;
}

export interface PointingOptions {
    /**
     * Extension threshold for the index finger to count as "pointing".
     * Strict — the user has to genuinely extend the index.
     */
    indexExtendedThreshold?: number;
    /**
     * Curl threshold for middle/ring/pinky to count as "not pointing".
     * The other fingers must be clearly curled, not just relaxed.
     */
    otherFingersCurledThreshold?: number;
    /**
     * Release thresholds — looser than activate to provide hysteresis.
     * If the index drops below this or another finger un-curls past
     * this, the gesture ends.
     */
    releaseIndexExtendedThreshold?: number;
    releaseOtherFingersCurledThreshold?: number;
    /** How long the pose must hold before pointing-start fires. */
    dwellTimeMs?: number;
    /**
     * EMA smoothing factor for the cursor position, in (0, 1].
     * Higher = more reactive, lower = more stable. 1.0 disables
     * smoothing entirely.
     */
    smoothingAlpha?: number;
    /** Override for the detector id. */
    id?: string;
}

interface ActiveState {
    handIndex: number;
    phase: "candidate" | "active";
    candidateSinceMs: number | null;
    activeSinceMs: number | null;
    /**
     * Smoothed cursor position. Lives in the state so successive
     * frames can blend with the previous value.
     */
    smoothedX: number | null;
    smoothedY: number | null;
}

const INDEX_TIP = 8;

export class PointingGesture implements GestureDetector<unknown> {
    readonly id: string;
    readonly inputKind = "hands" as const;

    private readonly indexExtendedThreshold: number;
    private readonly otherCurledThreshold: number;
    private readonly releaseIndexExtendedThreshold: number;
    private readonly releaseOtherCurledThreshold: number;
    private readonly dwellTimeMs: number;
    private readonly smoothingAlpha: number;

    private current: ActiveState | null = null;

    constructor(options: PointingOptions = {}) {
        this.id = options.id ?? "pointing";
        this.indexExtendedThreshold = options.indexExtendedThreshold ?? 0.7;
        this.otherCurledThreshold = options.otherFingersCurledThreshold ?? 0.5;
        this.releaseIndexExtendedThreshold =
            options.releaseIndexExtendedThreshold ?? 0.55;
        this.releaseOtherCurledThreshold =
            options.releaseOtherFingersCurledThreshold ?? 0.6;
        this.dwellTimeMs = options.dwellTimeMs ?? 200;
        this.smoothingAlpha = options.smoothingAlpha ?? 0.5;

        if (this.releaseIndexExtendedThreshold >= this.indexExtendedThreshold) {
            throw new Error(
                "PointingGesture: releaseIndexExtendedThreshold must be < indexExtendedThreshold",
            );
        }
        if (this.releaseOtherCurledThreshold <= this.otherCurledThreshold) {
            throw new Error(
                "PointingGesture: releaseOtherFingersCurledThreshold must be > otherFingersCurledThreshold",
            );
        }
        if (this.smoothingAlpha <= 0 || this.smoothingAlpha > 1) {
            throw new Error(
                "PointingGesture: smoothingAlpha must be in (0, 1]",
            );
        }
    }

    update(input: unknown, timestamp: number): GestureUpdate {
        const result = input as HandResult | null;
        const events: GestureEvent[] = [];
        const hands = result?.landmarks ?? [];

        // Step 1: if a hand is currently driving the gesture, check
        // whether it still satisfies the release criteria. If yes,
        // emit move (or transition candidate -> active). If not, end.
        if (this.current !== null) {
            const hand = hands[this.current.handIndex];
            const stillPointing = hand ? this.isPointingRelease(hand) : false;

            if (!stillPointing || !hand) {
                if (this.current.phase === "active") {
                    events.push({
                        type: "pointing-end",
                        handIndex: this.current.handIndex,
                        timestamp,
                        x: this.current.smoothedX ?? 0,
                        y: this.current.smoothedY ?? 0,
                        durationMs: timestamp - (this.current.activeSinceMs ?? timestamp),
                    });
                }
                this.current = null;
            } else {
                // Update smoothed cursor with this frame's index tip.
                const tip = hand[INDEX_TIP];
                if (tip) {
                    this.updateSmoothedPosition(this.current, tip);
                }

                if (this.current.phase === "candidate") {
                    const heldFor =
                        timestamp - (this.current.candidateSinceMs ?? timestamp);
                    if (heldFor >= this.dwellTimeMs) {
                        this.current.phase = "active";
                        this.current.activeSinceMs = timestamp;
                        this.current.candidateSinceMs = null;
                        events.push({
                            type: "pointing-start",
                            handIndex: this.current.handIndex,
                            timestamp,
                            x: this.current.smoothedX ?? 0,
                            y: this.current.smoothedY ?? 0,
                        });
                    }
                } else if (this.current.phase === "active") {
                    // High-frequency: one move event per frame while active.
                    // Consumer throttles in the handler if needed.
                    events.push({
                        type: "pointing-move",
                        handIndex: this.current.handIndex,
                        timestamp,
                        x: this.current.smoothedX ?? 0,
                        y: this.current.smoothedY ?? 0,
                    });
                }
            }
        }

        // Step 2: if no hand drives the gesture, look for one that
        // starts to satisfy the activate criteria.
        if (this.current === null) {
            for (let i = 0; i < hands.length; i++) {
                const hand = hands[i]!;
                if (this.isPointingActivate(hand)) {
                    const tip = hand[INDEX_TIP];
                    this.current = {
                        handIndex: i,
                        phase: "candidate",
                        candidateSinceMs: timestamp,
                        activeSinceMs: null,
                        smoothedX: tip?.x ?? null,
                        smoothedY: tip?.y ?? null,
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

    /**
     * Strict criteria for entering the gesture.
     */
    private isPointingActivate(hand: ReadonlyArray<Landmark>): boolean {
        if (!isFingerExtended(hand, "index", this.indexExtendedThreshold)) {
            return false;
        }
        const others: FingerName[] = ["middle", "ring", "pinky"];
        for (const finger of others) {
            if (!isFingerCurled(hand, finger, this.otherCurledThreshold)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Permissive criteria for staying in the gesture. Lower bar so
     * small wobbles don't end the gesture; hysteresis is the gap.
     */
    private isPointingRelease(hand: ReadonlyArray<Landmark>): boolean {
        if (!isFingerExtended(hand, "index", this.releaseIndexExtendedThreshold)) {
            return false;
        }
        const others: FingerName[] = ["middle", "ring", "pinky"];
        for (const finger of others) {
            if (!isFingerCurled(hand, finger, this.releaseOtherCurledThreshold)) {
                return false;
            }
        }
        return true;
    }

    private updateSmoothedPosition(state: ActiveState, tip: Landmark): void {
        if (state.smoothedX === null || state.smoothedY === null) {
            state.smoothedX = tip.x;
            state.smoothedY = tip.y;
            return;
        }
        const alpha = this.smoothingAlpha;
        state.smoothedX = state.smoothedX * (1 - alpha) + tip.x * alpha;
        state.smoothedY = state.smoothedY * (1 - alpha) + tip.y * alpha;
    }
}
