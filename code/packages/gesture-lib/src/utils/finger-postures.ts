/**
 * Internal helpers for evaluating finger postures from hand
 * landmarks. Shared between gestures that need to know whether
 * fingers are extended or curled (Pause, Pointing).
 *
 * Not exported from the public API. Kept here so that an
 * inconsistent threshold in one gesture cannot diverge from
 * another — same posture, same definition.
 *
 * All thresholds are expressed as multiples of the hand length
 * (wrist to middle-finger MCP), which makes them invariant to
 * camera distance.
 */

export interface Landmark {
    x: number;
    y: number;
    z?: number;
}

// MediaPipe hand-landmark indices.
// Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
const WRIST = 0;

const THUMB_TIP = 4;

const INDEX_MCP = 5;
const INDEX_PIP = 6;
const INDEX_TIP = 8;

const MIDDLE_MCP = 9;
const MIDDLE_PIP = 10;
const MIDDLE_TIP = 12;

const RING_MCP = 13;
const RING_PIP = 14;
const RING_TIP = 16;

const PINKY_MCP = 17;
const PINKY_PIP = 18;
const PINKY_TIP = 20;

export type FingerName = "index" | "middle" | "ring" | "pinky";

interface FingerLandmarkIndices {
    mcp: number;
    pip: number;
    tip: number;
}

const FINGER_INDICES: Record<FingerName, FingerLandmarkIndices> = {
    index: { mcp: INDEX_MCP, pip: INDEX_PIP, tip: INDEX_TIP },
    middle: { mcp: MIDDLE_MCP, pip: MIDDLE_PIP, tip: MIDDLE_TIP },
    ring: { mcp: RING_MCP, pip: RING_PIP, tip: RING_TIP },
    pinky: { mcp: PINKY_MCP, pip: PINKY_PIP, tip: PINKY_TIP },
};

/**
 * Computes the hand length, defined as the distance from the wrist
 * to the middle-finger MCP. Returns null if the required landmarks
 * are missing or the distance is degenerate.
 */
export function handLength(hand: ReadonlyArray<Landmark>): number | null {
    const wrist = hand[WRIST];
    const mcp = hand[MIDDLE_MCP];
    if (!wrist || !mcp) return null;
    const d = distance2D(wrist, mcp);
    return d < 1e-6 ? null : d;
}

/**
 * Returns true if the given finger is extended (straight, pointing
 * away from the palm).
 *
 * Definition: the distance from finger tip to finger MCP is larger
 * than `threshold * handLength`. When a finger is curled, the tip
 * comes close to the MCP and the distance shrinks below the
 * threshold.
 *
 * Defaults are tuned for clearly extended fingers (palm-up gesture).
 * For "definitely curled" the inverse threshold is closer to 0.4.
 */
export function isFingerExtended(
    hand: ReadonlyArray<Landmark>,
    finger: FingerName,
    threshold = 0.7,
): boolean {
    const indices = FINGER_INDICES[finger];
    const tip = hand[indices.tip];
    const mcp = hand[indices.mcp];
    if (!tip || !mcp) return false;

    const hl = handLength(hand);
    if (hl === null) return false;

    return distance2D(tip, mcp) / hl > threshold;
}

/**
 * Returns true if the given finger is curled (tip is close to the
 * MCP, as in a closed fist or pointing gesture's non-pointing
 * fingers).
 *
 * Defined as the inverse of extended, with a separate, more
 * permissive default threshold. Having `extended > 0.7` and
 * `curled < 0.5` leaves a small unclassified band between the two
 * — gestures that depend on both states can use that gap as
 * hysteresis.
 */
export function isFingerCurled(
    hand: ReadonlyArray<Landmark>,
    finger: FingerName,
    threshold = 0.5,
): boolean {
    const indices = FINGER_INDICES[finger];
    const tip = hand[indices.tip];
    const mcp = hand[indices.mcp];
    if (!tip || !mcp) return false;

    const hl = handLength(hand);
    if (hl === null) return false;

    return distance2D(tip, mcp) / hl < threshold;
}

/**
 * Returns true if the thumb is abducted *to the side* — away from
 * the palm in a direction roughly perpendicular to the hand's
 * long axis.
 *
 * Two checks combined:
 *   1. Thumb tip is far enough from index MCP (distance check).
 *   2. The thumb's direction relative to the hand's long axis is
 *      sideways, not along or against it. This distinguishes
 *      genuine abduction from "thumb folded over the palm".
 *
 * The hand's long axis is the vector from wrist to middle MCP.
 * The thumb's direction is the vector from wrist to thumb tip.
 * The angle between them, in 2D projection, should be roughly
 * between 30° and 120° for a side-abducted thumb.
 */
export function isThumbAbducted(
    hand: ReadonlyArray<Landmark>,
    distanceThreshold = 0.35,
    minAngleDeg = 30,
    maxAngleDeg = 120,
): boolean {
    const tip = hand[THUMB_TIP];
    const wrist = hand[WRIST];
    const indexMcp = hand[INDEX_MCP];
    const middleMcp = hand[MIDDLE_MCP];

    if (!tip || !wrist || !indexMcp || !middleMcp) return false;

    const hl = handLength(hand);
    if (hl === null) return false;

    // Distance check — thumb tip must be far enough from index MCP.
    if (distance2D(tip, indexMcp) / hl < distanceThreshold) return false;

    // Direction check — thumb direction vs. hand long axis.
    const handAxis = { x: middleMcp.x - wrist.x, y: middleMcp.y - wrist.y };
    const thumbDir = { x: tip.x - wrist.x, y: tip.y - wrist.y };

    const dot = handAxis.x * thumbDir.x + handAxis.y * thumbDir.y;
    const handMag = Math.sqrt(handAxis.x ** 2 + handAxis.y ** 2);
    const thumbMag = Math.sqrt(thumbDir.x ** 2 + thumbDir.y ** 2);

    if (handMag < 1e-6 || thumbMag < 1e-6) return false;

    const cosAngle = dot / (handMag * thumbMag);
    // Clamp to [-1, 1] to avoid NaN from floating-point drift.
    const clamped = Math.max(-1, Math.min(1, cosAngle));
    const angleDeg = (Math.acos(clamped) * 180) / Math.PI;

    return angleDeg >= minAngleDeg && angleDeg <= maxAngleDeg;
}

/**
 * 2D distance between two landmarks. Z is ignored on purpose:
 * MediaPipe's z is a relative depth estimate per hand (issue #1
 * observation), so including it adds noise to a measurement that
 * is already projection-based.
 */
export function distance2D(a: Landmark, b: Landmark): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}
