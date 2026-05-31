/**
 * React hook that wraps a PinchDetector and exposes its events and
 * per-frame state to the UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  PinchDetector,
  type GestureEvent,
  type PinchDetectorOptions,
  type PinchDetectorState,
} from "../gestures";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

interface UsePinchGestureOptions extends PinchDetectorOptions {
  /**
   * Fires when a discrete pinch event happens (start or end)
   */
  onEvent?: (event: GestureEvent) => void;
}

interface UsePinchGestureResult {
  processFrame: (
    result: HandLandmarkerResult | null,
    timestamp: number,
  ) => void;
  state: PinchDetectorState;
}

const EMPTY_STATE: PinchDetectorState = { hands: [] };

export function usePinchGesture(
  options: UsePinchGestureOptions = {},
): UsePinchGestureResult {
  // Detector instance survives across renders
  const detectorRef = useRef<PinchDetector | null>(null);
  if (detectorRef.current === null) {
    detectorRef.current = new PinchDetector(options);
  }
  const onEventRef = useRef(options.onEvent);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  });
  const [state, setState] = useState<PinchDetectorState>(EMPTY_STATE);

  // Last state used for cheap equality checks before triggering a React render
  const lastStateRef = useRef<PinchDetectorState>(EMPTY_STATE);

  const processFrame = useCallback(
    (result: HandLandmarkerResult | null, timestamp: number) => {
      const detector = detectorRef.current;
      if (!detector) return;

      const update = detector.update(result, timestamp);

      for (const event of update.events) {
        onEventRef.current?.(event);
      }

      const next =
        (update.state as PinchDetectorState | undefined) ?? EMPTY_STATE;

      // Only push to React state if something visually meaningful
      // changed
      if (hasVisibleChange(lastStateRef.current, next)) {
        lastStateRef.current = next;
        setState(next);
      }
    },
    [],
  );

  // Reset detector if the hook unmounts mid-gesture.
  useEffect(() => {
    return () => {
      detectorRef.current?.reset();
    };
  }, []);

  return { processFrame, state };
}

/**
 * Cheap structural diff: returns true if anything the indicator
 * cares about has changed. Uses a small epsilon on progress and
 * position to avoid re-rendering on sub-pixel jitter.
 */
function hasVisibleChange(
  a: PinchDetectorState,
  b: PinchDetectorState,
): boolean {
  if (a.hands.length !== b.hands.length) return true;
  for (let i = 0; i < a.hands.length; i++) {
    const ha = a.hands[i];
    const hb = b.hands[i];
    if (!ha || !hb) return true;
    if (ha.phase !== hb.phase) return true;
    if (ha.handIndex !== hb.handIndex) return true;
    if (Math.abs(ha.progress - hb.progress) > 0.02) return true;
    if (Math.abs(ha.position.x - hb.position.x) > 0.005) return true;
    if (Math.abs(ha.position.y - hb.position.y) > 0.005) return true;
  }
  return false;
}
