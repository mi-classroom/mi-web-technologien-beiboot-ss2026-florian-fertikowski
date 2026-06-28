/**
 * Subpath entry point for built-in gestures. Imported by consumers
 * as:
 *
 *   import { PinchGesture, SwipeGesture } from "gesture-lib/gestures";
 *
 */

export { PinchGesture } from "./pinch";
export type { PinchOptions, PinchState, PinchHandState } from "./pinch";

export { SwipeGesture } from "./swipe";
export type { SwipeOptions } from "./swipe";

export { PauseGesture } from "./pause";
export type { PauseOptions } from "./pause";

export { PointingGesture } from "./pointing";
export type { PointingOptions } from "./pointing";
