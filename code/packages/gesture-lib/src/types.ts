/**
 * Public types of the gesture library.
 *
 * The core abstraction is the `GestureDetector` interface — a small
 * contract that every gesture implementation fulfills. The library
 * orchestrates registered detectors via the GestureRecognizer; new
 * gestures can be plugged in without modifying the recognizer or
 * any other gesture.
 *
 * See ADR-0008 for the design rationale.
 */

// =====================================================================
// EVENT TYPES
// =====================================================================

/**
 * Discriminated union of all built-in gesture events. Consumers
 * switch on `type` and TypeScript ensures every case is handled.
 *
 * Custom gestures extend this union via module augmentation:
 *
 *   declare module "gesture-lib" {
 *     interface CustomGestureEventMap {
 *       "high-five": HighFiveEvent;
 *     }
 *   }
 *
 * The recognizer's `on(type, handler)` then accepts the custom
 * type with full type-safety.
 */
export type GestureEvent = BuiltInGestureEvent | CustomGestureEvent;

/**
 * Events fired by the gestures shipped with this library.
 */
export type BuiltInGestureEvent =
  | PinchStartEvent
  | PinchEndEvent
  | SwipeLeftEvent
  | SwipeRightEvent
  | PauseStartEvent
  | PauseEndEvent
  | PointingStartEvent
  | PointingMoveEvent
  | PointingEndEvent;

/**
 * Custom gestures extend this map via declaration merging. The
 * keys become valid event-type strings; the values become the
 * payload types.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomGestureEventMap {
  // Filled in by consumers via module augmentation.
}

/**
 * Union of all custom gesture events declared via
 * CustomGestureEventMap. Combined with BuiltInGestureEvent to form
 * GestureEvent.
 */
export type CustomGestureEvent =
  CustomGestureEventMap[keyof CustomGestureEventMap];

interface BaseGestureEvent {
  /** Monotonically increasing timestamp, copied from update(). */
  timestamp: number;
  /** Index of the hand that triggered the event, when applicable. */
  handIndex?: number;
}

export interface PinchStartEvent extends BaseGestureEvent {
  type: "pinch-start";
}

export interface PinchEndEvent extends BaseGestureEvent {
  type: "pinch-end";
  /** How long the pinch was held, in milliseconds. */
  durationMs: number;
}

export interface SwipeLeftEvent extends BaseGestureEvent {
  type: "swipe-left";
}

export interface SwipeRightEvent extends BaseGestureEvent {
  type: "swipe-right";
}

export interface PauseStartEvent extends BaseGestureEvent {
  type: "pause-start";
}

export interface PauseEndEvent extends BaseGestureEvent {
  type: "pause-end";
  /** How long the open-palm hold was active, in milliseconds. */
  durationMs: number;
}

/**
 * Fired once when the pointing pose is first held long enough to
 * count as deliberate. The position is the (smoothed) index-tip
 * location at the moment of activation.
 */
export interface PointingStartEvent extends BaseGestureEvent {
  type: "pointing-start";
  /** Cursor position in normalized [0,1] coordinates. */
  x: number;
  y: number;
}

/**
 * Fired on every frame while the pointing pose is held. Allows a
 * consumer to drive a cursor or any continuous-position UI.
 * High-frequency by design — the consumer throttles if needed.
 */
export interface PointingMoveEvent extends BaseGestureEvent {
  type: "pointing-move";
  x: number;
  y: number;
}

/**
 * Fired when the pointing pose ends (pose no longer recognized or
 * hand left frame). The position is the last known cursor
 * location.
 */
export interface PointingEndEvent extends BaseGestureEvent {
  type: "pointing-end";
  x: number;
  y: number;
  /** How long the pointing gesture was active, in milliseconds. */
  durationMs: number;
}

// =====================================================================
// DETECTOR CONTRACT
// =====================================================================

/**
 * Output of a detector's update() call for a single frame.
 * - `events`: discrete triggers that get dispatched to subscribers.
 * - `state`: optional continuous data for UI feedback (progress
 *   indicators, cursor positions, etc.). Each detector defines its
 *   own state shape; consumers cast appropriately.
 */
export interface GestureUpdate {
  events: GestureEvent[];
  state?: unknown;
}

/**
 * Contract every gesture implementation fulfills.
 *
 * The library is generic over the input type T so future
 * detectors operating on pose data instead of hand data fit the
 * same interface.
 */
export interface GestureDetector<T = unknown> {
  /**
   * Stable identifier for this detector. Used by the recognizer to
   * key per-frame state in RecognizerFrameState. Must be unique
   * across registered detectors on a single recognizer.
   */
  readonly id: string;

  /**
   * Optional declaration of what input this detector expects.
   * Informational for v1; reserved for future multi-input routing.
   */
  readonly inputKind?: "hands" | "pose" | "any";

  /**
   * Called once per frame with the raw detection result and the
   * current timestamp. Returns any events that fire this frame
   * plus optional per-frame state.
   */
  update(input: T, timestamp: number): GestureUpdate;

  /**
   * Clears internal state. Called by the recognizer's reset(), and
   * may be called directly by consumers (e.g. on camera reconnect).
   */
  reset(): void;
}

// =====================================================================
// RECOGNIZER OUTPUT
// =====================================================================

/**
 * Aggregated per-frame state from all registered detectors. Each
 * entry is keyed by the detector's `id`. Consumers cast the value
 * to the expected shape for that detector.
 *
 *   const pinchState = state.detectors["pinch"] as PinchState;
 */
export interface RecognizerFrameState {
  detectors: Record<string, unknown>;
}

// =====================================================================
// EVENT TYPE HELPERS
// =====================================================================

/**
 * Extracts the union of all valid event-type strings, including
 * those added by consumers via CustomGestureEventMap.
 */
export type GestureEventType = GestureEvent["type"];

/**
 * Given an event-type string, resolves the corresponding event
 * payload type. Used by GestureRecognizer.on() for type-safe
 * subscriptions.
 */
export type EventByType<T extends GestureEventType> = Extract<
  GestureEvent,
  { type: T }
>;
