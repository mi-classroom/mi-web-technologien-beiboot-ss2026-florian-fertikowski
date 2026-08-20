/**
 * React hook that wraps a GestureRecognizer instance and exposes
 * its events and per-frame state to the React layer.
 *
 * Replaces the per-gesture hooks (use-pinch-gesture, use-swipe-
 * gesture) that lived here before the library refactor. The
 * recognizer is configured once via the `gestures` and `handlers`
 * options; React's lifecycle drives setup and teardown.
 *
 * Design notes:
 * - The recognizer's lifecycle is handled in a single useEffect:
 *   create + register + subscribe on mount, dispose on unmount.
 *   Splitting this across multiple effects creates ordering bugs
 *   in React Strict Mode (mount/unmount/remount during dev).
 * - Event handlers are mirrored into a ref so the subscription
 *   set up at mount stays valid as the consumer's handler
 *   functions change identity on re-renders.
 * - Per-frame state is pushed into React state only when it
 *   visibly changes, so 30 FPS frames don't trigger 30 FPS
 *   re-renders for stationary content.
 * - Pointing position is treated specially: it derives from
 *   high-frequency move events and is updated on every active
 *   frame, but we still throttle re-renders via a position-delta
 *   threshold so a perfectly still pointing pose doesn't render
 *   30 times per second.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureRecognizer,
  type GestureDetector,
  type GestureEvent,
  type GestureEventType,
  type EventByType,
} from "gesture-lib";
import type { PinchState, PinchHandState } from "gesture-lib/gestures";

type HandlerMap = {
  [K in GestureEventType]?: (event: EventByType<K>) => void;
};

interface UseGestureRecognizerOptions {
  gestures: GestureDetector[];
  handlers?: HandlerMap;
}

interface UseGestureRecognizerResult {
  processFrame: (input: unknown, timestamp: number) => void;
  /** Empty hands array when no PinchGesture is registered or no
   *  pinch is in progress. */
  pinchState: PinchState;
  /** Current pointing cursor position, or null when no pointing
   *  gesture is active. Updates only when the position changes
   *  meaningfully (to avoid 30 FPS re-renders). */
  pointingPosition: { x: number; y: number } | null;
}

const EMPTY_PINCH_STATE: PinchState = { hands: [] };

export function useGestureRecognizer(
  options: UseGestureRecognizerOptions,
): UseGestureRecognizerResult {
  const { gestures, handlers } = options;

  const recognizerRef = useRef<GestureRecognizer | null>(null);

  // Mirror handlers into a ref so the subscription set up at mount
  // doesn't need to re-attach when the consumer's handler
  // identities change on re-renders.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // Per-frame React state.
  const [pinchState, setPinchState] = useState<PinchState>(EMPTY_PINCH_STATE);
  const [pointingPosition, setPointingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const lastPinchStateRef = useRef<PinchState>(EMPTY_PINCH_STATE);
  const lastPointingPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Lifecycle: create recognizer, register gestures, wire the
  // catch-all subscription, dispose on unmount. All in one effect
  // to avoid Strict Mode ordering issues.
  useEffect(() => {
    const recognizer = new GestureRecognizer();
    recognizerRef.current = recognizer;

    for (const detector of gestures) {
      recognizer.register(detector);
    }

    const unsubscribeAny = recognizer.onAny((event: GestureEvent) => {
      // Maintain the internal pointing-position state. The
      // consumer's handler (if any) gets called as well, but the
      // hook owns the React-state mirroring.
      maintainPointingState(event);

      const map = handlersRef.current;
      if (map) {
        const handler = map[event.type as GestureEventType] as
          ((event: GestureEvent) => void) | undefined;
        handler?.(event);
      }
    });

    return () => {
      unsubscribeAny();
      recognizer.dispose();
      if (recognizerRef.current === recognizer) {
        recognizerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maintainPointingState = useCallback((event: GestureEvent) => {
    if (event.type === "pointing-start" || event.type === "pointing-move") {
      const next = { x: event.x, y: event.y };
      const last = lastPointingPositionRef.current;
      if (!last || positionChanged(last, next)) {
        lastPointingPositionRef.current = next;
        setPointingPosition(next);
      }
    } else if (event.type === "pointing-end") {
      lastPointingPositionRef.current = null;
      setPointingPosition(null);
    }
  }, []);

  const processFrame = useCallback((input: unknown, timestamp: number) => {
    const recognizer = recognizerRef.current;
    if (!recognizer) return;
    const frameState = recognizer.update(input, timestamp);

    const newPinch =
      (frameState.detectors["pinch"] as PinchState | undefined) ??
      EMPTY_PINCH_STATE;

    if (pinchHasVisibleChange(lastPinchStateRef.current, newPinch)) {
      lastPinchStateRef.current = newPinch;
      setPinchState(newPinch);
    }
  }, []);

  return useMemo(
    () => ({ processFrame, pinchState, pointingPosition }),
    [processFrame, pinchState, pointingPosition],
  );
}

function positionChanged(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  // Threshold ~0.5% of the frame width. Smaller deltas are sub-
  // pixel jitter, not real cursor motion.
  return Math.abs(a.x - b.x) > 0.005 || Math.abs(a.y - b.y) > 0.005;
}

function pinchHasVisibleChange(a: PinchState, b: PinchState): boolean {
  if (a.hands.length !== b.hands.length) return true;
  for (let i = 0; i < a.hands.length; i++) {
    if (pinchHandStateChanged(a.hands[i]!, b.hands[i]!)) return true;
  }
  return false;
}

function pinchHandStateChanged(a: PinchHandState, b: PinchHandState): boolean {
  if (a.handIndex !== b.handIndex) return true;
  if (a.phase !== b.phase) return true;
  if (Math.abs(a.progress - b.progress) > 0.02) return true;
  if (Math.abs(a.position.x - b.position.x) > 0.005) return true;
  if (Math.abs(a.position.y - b.position.y) > 0.005) return true;
  return false;
}
