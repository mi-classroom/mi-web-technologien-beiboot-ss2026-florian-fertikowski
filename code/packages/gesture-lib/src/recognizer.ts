/**
 * Central orchestrator of the gesture library.
 *
 * Holds a set of registered detectors. Each call to update() flows
 * into all detectors, collects their events and per-frame state,
 * and dispatches events to subscribers. The recognizer itself is
 * agnostic about which gestures exist — they come in via register().
 *
 * See ADR-0008 for the design rationale.
 */

import type {
    GestureDetector,
    GestureEvent,
    GestureEventType,
    EventByType,
    RecognizerFrameState,
} from "./types";

type AnyHandler = (event: GestureEvent) => void;
type TypedHandler<T extends GestureEventType> = (
    event: EventByType<T>,
) => void;

export class GestureRecognizer {
    private readonly detectors = new Map<string, GestureDetector>();
    private readonly handlersByType = new Map<string, Set<AnyHandler>>();
    private readonly anyHandlers = new Set<AnyHandler>();
    private disposed = false;

    /**
     * Adds a detector to the recognizer. Returns a function that
     * unregisters it. The function pattern lets consumers store the
     * teardown without holding on to the detector reference.
     *
     * If a detector with the same id is already registered, throws —
     * silent overwrite would lose state on the previous instance and
     * lead to confusing bugs.
     */
    register(detector: GestureDetector): () => void {
        this.assertNotDisposed();
        if (this.detectors.has(detector.id)) {
            throw new Error(
                `Detector with id "${detector.id}" is already registered`,
            );
        }
        this.detectors.set(detector.id, detector);
        return () => {
            this.detectors.delete(detector.id);
        };
    }

    /**
     * Subscribes to a specific event type. Returns a function that
     * unsubscribes. The handler is typed to the specific event
     * variant — accessing event.durationMs on a "pinch-end" handler
     * works; accessing it on a "swipe-left" handler is a compile
     * error.
     */
    on<T extends GestureEventType>(
        type: T,
        handler: TypedHandler<T>,
    ): () => void {
        this.assertNotDisposed();
        let handlers = this.handlersByType.get(type);
        if (!handlers) {
            handlers = new Set();
            this.handlersByType.set(type, handlers);
        }
        // The cast is safe: we dispatch each event only to handlers
        // registered for its exact type, so the handler always
        // receives the event variant it was typed against.
        const wrapper = handler as AnyHandler;
        handlers.add(wrapper);
        return () => {
            handlers!.delete(wrapper);
        };
    }

    /**
     * Subscribes to all events from any detector. Useful for logging,
     * debugging, or generic dispatchers. Returns a function that
     * unsubscribes.
     */
    onAny(handler: AnyHandler): () => void {
        this.assertNotDisposed();
        this.anyHandlers.add(handler);
        return () => {
            this.anyHandlers.delete(handler);
        };
    }

    /**
     * Feeds a frame into all registered detectors. Collects their
     * outputs, dispatches events to subscribers, and returns the
     * combined per-frame state.
     *
     * The input is typed `unknown` to keep the library agnostic to
     * any specific ML library. Each detector casts internally.
     */
    update(input: unknown, timestamp: number): RecognizerFrameState {
        this.assertNotDisposed();
        const stateByDetector: Record<string, unknown> = {};

        for (const detector of this.detectors.values()) {
            const result = detector.update(input, timestamp);

            for (const event of result.events) {
                this.dispatch(event);
            }

            if (result.state !== undefined) {
                stateByDetector[detector.id] = result.state;
            }
        }

        return { detectors: stateByDetector };
    }

    /**
     * Resets all registered detectors. Their internal state is
     * cleared; subscribers remain attached.
     */
    reset(): void {
        this.assertNotDisposed();
        for (const detector of this.detectors.values()) {
            detector.reset();
        }
    }

    /**
     * Releases all detectors and subscribers. After dispose() the
     * recognizer is no longer usable; subsequent calls throw.
     */
    dispose(): void {
        if (this.disposed) return;
        this.detectors.clear();
        this.handlersByType.clear();
        this.anyHandlers.clear();
        this.disposed = true;
    }

    private dispatch(event: GestureEvent): void {
        const typed = this.handlersByType.get(event.type);
        if (typed) {
            // Copy the set before iterating: a handler that unsubscribes
            // itself shouldn't disturb the current dispatch.
            for (const handler of [...typed]) {
                handler(event);
            }
        }
        for (const handler of [...this.anyHandlers]) {
            handler(event);
        }
    }

    private assertNotDisposed(): void {
        if (this.disposed) {
            throw new Error("GestureRecognizer has been disposed");
        }
    }
}
