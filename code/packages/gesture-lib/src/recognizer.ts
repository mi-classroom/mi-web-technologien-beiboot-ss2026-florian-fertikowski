/**
 * Central orchestrator of the gesture library.
 *
 * Holds a set of registered detectors. Each call to update() flows
 * into all detectors, collects their events and per-frame state,
 * and dispatches events to subscribers. The recognizer itself is
 * agnostic about which gestures exist — they come in via register().
 *
 * See ADR-0008 for the design rationale of the core API and
 * ADR-0011 for the context filtering mechanism.
 */

import type {
  GestureDetector,
  GestureEvent,
  GestureEventType,
  EventByType,
  RecognizerFrameState,
} from "./types";

type AnyHandler = (event: GestureEvent) => void;
type TypedHandler<T extends GestureEventType> = (event: EventByType<T>) => void;

/**
 * Options for the third argument of `on()`. Currently only
 * `contexts`, but shaped as an object to leave room for future
 * additions (e.g. `once`, `priority`) without another breaking
 * change.
 */
export interface SubscribeOptions {
  /**
   * Contexts in which this handler should fire. If omitted, the
   * handler fires in every context (the default, so existing
   * callers without options keep working).
   *
   * Contexts are matched against the recognizer's active context
   * as set by `setActiveContext()`. When the active context is
   * `null` (the initial state), all handlers fire regardless of
   * their `contexts` list — a null context means "no filter".
   */
  contexts?: readonly string[];
}

/**
 * Handler entry stored internally. The event type is not part of
 * the entry because it's implicit in the map key.
 */
interface HandlerEntry {
  handler: AnyHandler;
  contexts?: readonly string[];
}

export class GestureRecognizer {
  private readonly detectors = new Map<string, GestureDetector>();
  private readonly handlersByType = new Map<string, Set<HandlerEntry>>();
  private readonly anyHandlers = new Set<HandlerEntry>();
  private activeContext: string | null = null;
  private disposed = false;

  /**
   * Adds a detector to the recognizer. Returns a function that
   * unregisters it. Throws if a detector with the same id is
   * already registered.
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
   * Subscribes to a specific event type. The handler is typed to
   * the specific event variant.
   *
   * When `options.contexts` is provided, the handler only fires
   * while the recognizer's active context is one of the listed
   * values. When the active context is `null` (the initial state
   * after construction), all handlers fire regardless. See
   * `setActiveContext()`.
   *
   * Returns a function that unsubscribes.
   */
  on<T extends GestureEventType>(
    type: T,
    handler: TypedHandler<T>,
    options?: SubscribeOptions,
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
    const entry: HandlerEntry = {
      handler: handler as AnyHandler,
      contexts: options?.contexts,
    };
    handlers.add(entry);
    return () => {
      handlers!.delete(entry);
    };
  }

  /**
   * Subscribes to all events from any detector. Same context
   * semantics as `on()`.
   */
  onAny(handler: AnyHandler, options?: SubscribeOptions): () => void {
    this.assertNotDisposed();
    const entry: HandlerEntry = { handler, contexts: options?.contexts };
    this.anyHandlers.add(entry);
    return () => {
      this.anyHandlers.delete(entry);
    };
  }

  /**
   * Sets the currently-active context. Handlers whose `contexts`
   * list does not include this value are skipped when events fire.
   *
   * Passing `null` disables context filtering — every handler
   * fires regardless of its `contexts` list. This is the initial
   * state.
   *
   * Setting the same context repeatedly is a no-op.
   */
  setActiveContext(context: string | null): void {
    this.assertNotDisposed();
    this.activeContext = context;
  }

  /**
   * Returns the currently-active context, or null when none is set.
   */
  getActiveContext(): string | null {
    return this.activeContext;
  }

  /**
   * Feeds a frame into all registered detectors. Collects their
   * outputs, dispatches events to subscribers, and returns the
   * combined per-frame state.
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
   * Resets all registered detectors.
   */
  reset(): void {
    this.assertNotDisposed();
    for (const detector of this.detectors.values()) {
      detector.reset();
    }
  }

  /**
   * Releases all detectors and subscribers. After dispose() the
   * recognizer is no longer usable.
   */
  dispose(): void {
    if (this.disposed) return;
    this.detectors.clear();
    this.handlersByType.clear();
    this.anyHandlers.clear();
    this.activeContext = null;
    this.disposed = true;
  }

  private dispatch(event: GestureEvent): void {
    const typed = this.handlersByType.get(event.type);
    if (typed) {
      for (const entry of [...typed]) {
        if (this.shouldFire(entry)) entry.handler(event);
      }
    }
    for (const entry of [...this.anyHandlers]) {
      if (this.shouldFire(entry)) entry.handler(event);
    }
  }

  /**
   * Returns true if a handler entry should fire for the current
   * event, based on the active context and the entry's context
   * restrictions.
   *
   * Rules:
   * - Entries without `contexts` always fire.
   * - When the active context is null, all entries fire.
   * - Otherwise the entry fires only if its `contexts` list
   *   includes the active context.
   */
  private shouldFire(entry: HandlerEntry): boolean {
    if (!entry.contexts) return true;
    if (this.activeContext === null) return true;
    return entry.contexts.includes(this.activeContext);
  }

  private assertNotDisposed(): void {
    if (this.disposed) {
      throw new Error("GestureRecognizer has been disposed");
    }
  }
}
