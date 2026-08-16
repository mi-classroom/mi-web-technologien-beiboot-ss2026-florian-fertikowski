"use client";

/**
 * React hook wrapping GestureRecognizer for reha-vision.
 *
 * Ported from packages/reha-demo (issue #4 / ADR-0011) without
 * logic changes. Uses the library's built-in context filtering:
 * handlers declare which app contexts they apply to, and the hook
 * mirrors the app's current context into
 * `recognizer.setActiveContext()`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureRecognizer,
  type GestureDetector,
  type GestureEvent,
  type GestureEventType,
  type EventByType,
} from "gesture-lib";

interface ScopedHandler<C extends string, T extends GestureEventType> {
  contexts: C[];
  handler: (event: EventByType<T>) => void;
}

type ScopedHandlerMap<C extends string> = {
  [K in GestureEventType]?: ScopedHandler<C, K>;
};

interface UseGestureRecognizerOptions<C extends string> {
  gestures: GestureDetector[];
  handlers?: ScopedHandlerMap<C>;
  activeContext: C;
}

interface UseGestureRecognizerResult {
  processFrame: (input: unknown, timestamp: number) => void;
  pointingPosition: { x: number; y: number } | null;
}

const EVENT_TYPES: GestureEventType[] = [
  "pinch-start",
  "pinch-end",
  "swipe-left",
  "swipe-right",
  "pause-start",
  "pause-end",
  "pointing-start",
  "pointing-move",
  "pointing-end",
];

export function useGestureRecognizer<C extends string>(
  options: UseGestureRecognizerOptions<C>,
): UseGestureRecognizerResult {
  const { gestures, handlers, activeContext } = options;

  const recognizerRef = useRef<GestureRecognizer | null>(null);

  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    recognizerRef.current?.setActiveContext(activeContext);
  }, [activeContext]);

  const [pointingPosition, setPointingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const lastPointingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const recognizer = new GestureRecognizer();
    recognizerRef.current = recognizer;
    recognizer.setActiveContext(activeContext);

    for (const detector of gestures) {
      recognizer.register(detector);
    }

    const unsubscribes: Array<() => void> = [];

    for (const type of EVENT_TYPES) {
      const contexts = handlers?.[type]?.contexts;
      const wrapper = ((event: GestureEvent) => {
        const entry = handlersRef.current?.[type];
        if (!entry) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry.handler as any)(event);
      }) as (event: EventByType<typeof type>) => void;

      unsubscribes.push(
        recognizer.on(type, wrapper, contexts ? { contexts } : undefined),
      );
    }

    const unsubscribePointing = recognizer.onAny((event: GestureEvent) => {
      if (event.type === "pointing-start" || event.type === "pointing-move") {
        const next = { x: event.x, y: event.y };
        const last = lastPointingRef.current;
        if (!last || positionChanged(last, next)) {
          lastPointingRef.current = next;
          setPointingPosition(next);
        }
      } else if (event.type === "pointing-end") {
        lastPointingRef.current = null;
        setPointingPosition(null);
      }
    });

    return () => {
      for (const u of unsubscribes) u();
      unsubscribePointing();
      recognizer.dispose();
      if (recognizerRef.current === recognizer) {
        recognizerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processFrame = useCallback((input: unknown, timestamp: number) => {
    recognizerRef.current?.update(input, timestamp);
  }, []);

  return useMemo(
    () => ({ processFrame, pointingPosition }),
    [processFrame, pointingPosition],
  );
}

function positionChanged(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  return Math.abs(a.x - b.x) > 0.005 || Math.abs(a.y - b.y) > 0.005;
}
