/**
 * React hook wrapping GestureRecognizer for the reha-demo.
 *
 * Uses the library's built-in context filtering (added in
 * ADR-0011). The hook is now a thin lifecycle layer over the
 * library:
 *
 * - Constructs the recognizer once, registers gestures
 * - Subscribes handlers with their declared contexts
 * - Mirrors the active React context into
 *   `recognizer.setActiveContext()` on every change
 * - Owns the pointing cursor state (always-on, unfiltered)
 *
 * Compare with the pre-ADR-0011 version to see how much filtering
 * logic the library change absorbed.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureRecognizer,
  type GestureDetector,
  type GestureEvent,
  type GestureEventType,
  type EventByType,
} from "gesture-lib";

/**
 * Scoped handler for a single event type. Contexts declare which
 * app screens (or modes) this handler applies to.
 */
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

/** All built-in event types, iterated when wiring subscriptions. */
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

  // Handlers are held in a ref so re-renders don't force re-
  // subscription. The subscription set up on mount reads from this
  // ref on every dispatch.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // Mirror the active context into the library. The library then
  // filters events accordingly, so our per-event wrappers only
  // fire in the right context.
  useEffect(() => {
    recognizerRef.current?.setActiveContext(activeContext);
  }, [activeContext]);

  // Pointing position lives in React state, updated when it
  // changes meaningfully. See ADR-0010 for why we throttle by
  // delta rather than emit fewer library events.
  const [pointingPosition, setPointingPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const lastPointingRef = useRef<{ x: number; y: number } | null>(null);

  // Lifecycle effect: create recognizer, register gestures, wire
  // subscriptions, dispose on unmount. Single effect keeps Strict
  // Mode's mount/unmount/remount safe.
  useEffect(() => {
    const recognizer = new GestureRecognizer();
    recognizerRef.current = recognizer;
    // Prime the context so the first frame filters correctly.
    recognizer.setActiveContext(activeContext);

    for (const detector of gestures) {
      recognizer.register(detector);
    }

    const unsubscribes: Array<() => void> = [];

    // One subscription per event type. The library filters by
    // context, so the wrapper below only runs in matching contexts.
    // At dispatch time it reads the latest handler from the ref
    // and delegates.
    //
    // Note we pass the contexts *once* at subscribe time. If the
    // consumer later replaces the handler for an event with one
    // that has different contexts, only the handler function is
    // picked up — the context list is fixed. In practice the map
    // is defined once with useMemo or as a stable object, so this
    // is not a limitation in real code.
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

    // Pointing position is maintained outside the context filter —
    // the cursor should update whenever pointing is active,
    // regardless of which app screen the consumer treats as the
    // "pointing screen". Use onAny with no contexts.
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
