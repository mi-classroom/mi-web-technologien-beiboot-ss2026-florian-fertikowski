"use client";

/**
 * React hook wrapping GestureRecognizer for reha-vision.
 *
 * Ported from packages/reha-demo (issue #4 / ADR-0011) without
 * logic changes. Uses the library's built-in context filtering:
 * handlers declare which app contexts they apply to, and the hook
 * mirrors the app's current context into
 * `recognizer.setActiveContext()`.
 *
 * Event subscriptions are derived from whatever keys are present
 * in the `handlers` object passed in, not from a fixed list of the
 * library's built-in event types. An earlier version hardcoded
 * that list (only the nine built-in pinch/swipe/pause/pointing
 * event names), which meant a custom gesture's events — like
 * FistGesture's "fist-start"/"fist-end", added via module
 * augmentation — were never subscribed to at all: TypeScript
 * happily accepted `handlers["fist-start"]` as a valid key (the
 * augmented type says it's legitimate), but the hardcoded runtime
 * list didn't know it existed, so `recognizer.on("fist-start", ...)`
 * was simply never called. The detector fired the event correctly;
 * nothing was listening. Deriving the subscription list from the
 * handlers object itself means any future custom gesture works
 * through this hook without editing the hook again.
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

  const [pointingPosition, setPointingPosition] =
    useState<{ x: number; y: number } | null>(null);
  const lastPointingRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const recognizer = new GestureRecognizer();
    recognizerRef.current = recognizer;
    recognizer.setActiveContext(activeContext);

    for (const detector of gestures) {
      recognizer.register(detector);
    }

    const unsubscribes: Array<() => void> = [];

    // Subscribe to whatever event types the consumer declared
    const eventTypes = Object.keys(
      handlers ?? {},
    ) as GestureEventType[];

    for (const type of eventTypes) {
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
