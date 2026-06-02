/**
 * React hook that wraps a SwipeDetector and forwards its events to
 * the UI.
 */

import { useCallback, useEffect, useRef } from "react";
import {
  SwipeDetector,
  type GestureEvent,
  type SwipeDetectorOptions,
} from "../gestures";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

interface UseSwipeGestureOptions extends SwipeDetectorOptions {
  /**
   * Fires when a swipe is recognized
   */
  onEvent?: (event: GestureEvent) => void;
}

interface UseSwipeGestureResult {
  processFrame: (
    result: HandLandmarkerResult | null,
    timestamp: number,
  ) => void;
}

export function useSwipeGesture(
  options: UseSwipeGestureOptions = {},
): UseSwipeGestureResult {
  const detectorRef = useRef<SwipeDetector | null>(null);

  if (detectorRef.current === null) {
    detectorRef.current = new SwipeDetector(options);
  }

  const onEventRef = useRef(options.onEvent);
  useEffect(() => {
    onEventRef.current = options.onEvent;
  });

  const processFrame = useCallback(
    (result: HandLandmarkerResult | null, timestamp: number) => {
      const detector = detectorRef.current;
      if (!detector) return;
      const update = detector.update(result, timestamp);
      for (const event of update.events) {
        onEventRef.current?.(event);
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

  return { processFrame };
}
