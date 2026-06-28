/**
 * Pause gesture detector.
 *
 * Recognises an open-palm hold as a deliberate pause/resume signal:
 * all four fingers extended, thumb abducted, held for a dwell
 * duration.
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
    isThumbAbducted,
} from "../utils/finger-postures";

interface HandResult {
    landmarks?: ReadonlyArray<ReadonlyArray<Landmark>>;
}

export interface PauseOptions {
    /**
     * Extension threshold (tip-to-MCP distance over hand length)
     * required for *all four* non-thumb fingers to count as "open".
     * Strict, since activation should be deliberate.
     */
    activateExtendedThreshold?: number;
    /**
     * Lower threshold below which a previously-extended finger
     * counts as "closed", ending the gesture. Must be < activate
     * threshold to provide hysteresis.
     */
    releaseExtendedThreshold?: number;
    /**
     * Threshold for thumb abduction (thumb-tip to index-MCP over
     * hand length).
     */
    thumbAbductionThreshold?: number;
    /** How long the posture must hold before pause-start fires. */
    dwellTimeMs?: number;
    /** Override for the detector id. */
    id?: string;
}

interface ActiveState {
    /** Index of the hand currently driving the gesture. */
    handIndex: number;
    phase: "candidate" | "active";
    /** When the candidate phase began, used for dwell-time. */
    candidateSinceMs: number | null;
    /** When the active phase began, used for durationMs. */
    activeSinceMs: number | null;
}

export class PauseGesture implements GestureDetector<unknown> {
    readonly id: string;
    readonly inputKind = "hands" as const;

    private readonly activateThreshold: number;
    private readonly releaseThreshold: number;
    private readonly thumbThreshold: number;
    private readonly dwellTimeMs: number;

    /**
     * Per-instance state. Only one hand can hold Pause at a time, so
     * this is a single optional record rather than a map.
     */
    private current: ActiveState | null = null;

    constructor(options: PauseOptions = {}) {
        this.id = options.id ?? "pause";
        this.activateThreshold = options.activateExtendedThreshold ?? 0.6;
        this.releaseThreshold = options.releaseExtendedThreshold ?? 0.45;
        this.thumbThreshold = options.thumbAbductionThreshold ?? 0.35;
        this.dwellTimeMs = options.dwellTimeMs ?? 250;

        if (this.releaseThreshold >= this.activateThreshold) {
            throw new Error(
                "PauseGesture: releaseExtendedThreshold must be less than activateExtendedThreshold",
            );
        }
    }

    update(input: unknown, timestamp: number): GestureUpdate {
        const result = input as HandResult | null;
        const events: GestureEvent[] = [];
        const hands = result?.landmarks ?? [];

        // Step 1: if a hand is already driving the gesture, check its
        // posture against the *release* criteria. If it still passes,
        // we stay in the current phase (and possibly transition
        // candidate -> active). If it fails, the gesture ends.
        if (this.current !== null) {
            const hand = hands[this.current.handIndex];
            const stillOpen = hand ? this.isOpenPalmRelease(hand) : false;

            if (!stillOpen) {
                if (this.current.phase === "active") {
                    events.push({
                        type: "pause-end",
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
                        type: "pause-start",
                        handIndex: this.current.handIndex,
                        timestamp,
                    });
                }
            }
        }

        // Step 2: if no hand is currently driving the gesture, look
        // for one that just satisfies the activation criteria.
        if (this.current === null) {
            for (let i = 0; i < hands.length; i++) {
                const hand = hands[i]!;
                if (this.isOpenPalmActivate(hand)) {
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

    /**
     * Strict criteria for entering the gesture. All four fingers
     * extended above the higher threshold, thumb abducted.
     */
    private isOpenPalmActivate(hand: ReadonlyArray<Landmark>): boolean {
        return (
            this.allFingersExtended(hand, this.activateThreshold) &&
            isThumbAbducted(hand, this.thumbThreshold)
        );
    }

    /**
     * Permissive criteria for staying in the gesture. Fingers may
     * relax a little before we declare the pause over.
     */
    private isOpenPalmRelease(hand: ReadonlyArray<Landmark>): boolean {
        return (
            this.allFingersExtended(hand, this.releaseThreshold) &&
            isThumbAbducted(hand, this.thumbThreshold)
        );
    }

    private allFingersExtended(
        hand: ReadonlyArray<Landmark>,
        threshold: number,
    ): boolean {
        const fingers: FingerName[] = ["index", "middle", "ring", "pinky"];
        for (const finger of fingers) {
            if (!isFingerExtended(hand, finger, threshold)) return false;
        }
        return true;
    }
}
