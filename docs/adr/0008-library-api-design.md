# ADR-0008: Library API design

- Status: accepted
- Workload: 2h
- Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
- Issue: [3](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/3)
- Date: 2026-05-XX

## Context

Goal with Issue #3 was for the prototype gestures from prior issues to be turned into a proper library. This included the following criteria:

- Gesture logic is encapsulated in a library structure separate from the demo application
- Adding new gestures must not require modifying existing code
- The public API is documented: instantiation, gesture registration, event handling.

Reference libraries from the issue (Hammer.js, ZingTouch, Fingerpose) take different approaches. Each represents a
recognizable pattern in the JavaScript ecosystem; the decisions below take a position on each pattern.

## Considered Decisions

This ADR groups four design decisions that together define the library's API surface.

1. **Overall API style** — how the library is shaped: open
   plug-in system or functional factory
2. **Detector contract** — how individual gestures are written
   and consumed
3. **Event model** — how events are typed, dispatched, and
   extended by consumers with their own gestures
4. **Library boundaries** — what the library does and does not
   own

## Decision

The library uses a **plug-in-based architecture** with a
`GestureRecognizer` class as the central orchestrator. Individual
gestures are classes implementing a `GestureDetector` interface
and are registered with the recognizer at runtime. Events are
typed via a discriminated union; consumers extend the union for
custom gestures via TypeScript module augmentation. The
recognizer is fed frames by the consumer (consumer owns the
detection loop) and accepts any input type, leaving the
landmark-specific casting to individual detectors.

## Decision Blocks

### Block 1: Overall API style

**Considered options:**

- **Plug-in-based**: `new GestureRecognizer().register(new PinchGesture())` — recognizer is agnostic about which gestures exist; gestures are added at runtime.
- **Functional factory**: `createRecognizer({ gestures: { pinch: true, swipe: true } })`, configuration object decides what is active.
- **Declarative gesture description**: gestures are not classes with logic, but data structures describing required postures; a single recognition engine matches input against the descriptions.

**Decision: plug-in-based.**

**Pros and cons:**

#### Plug-in-based (chosen)

**Pros**

- Recognizer code does not change when new gestures are added
- Each gesture is an independent unit with its own logic, state, and configuration
- Established pattern: Hammer.js uses `Manager.add(new Pan())` in its full-control API
- Per-gesture configuration is colocated with the gesture (`new PinchGesture({ dwellTimeMs: 200 })`) rather than scattered

**Cons**

- More boilerplate at the consumer side than a one-line factory call
- Discoverability depends on documentation and imports, not autocomplete on a central object.

#### Functional factory

**Pros**

- Aligns with modern functional patterns in JS/TS.
- Configuration-as-data is easy to validate and serialize.

**Cons**

- Library still has to know about every gesture to translate the config flag (`pinch: true`) into actual detection logic
- Adding a new gesture requires extending the config schema and the factory's internal switch
- Re-configuration at runtime means re-creating the recognizer

#### Declarative gesture description (Fingerpose-style)

**Pros**

- Very simple gestures (static postures) can be described in a few lines of data without writing any logic
- Gesture descriptions are easy to inspect and serialize

**Cons**

- Restricts gestures to whatever the description language can express
- The recognition engine becomes the place where new patterns must be added
- Mismatch with this project's gesture mix, which is mostly algorithmic, not posture-matching.

### Block 2: Detector contract

**Considered options:**

For **how a detector is written**:

- **Class implementing an interface**: each gesture is a class conforming to a `GestureDetector` interface
- **Factory function returning an object**: each gesture is a factory like `createPinchGesture(...)` that returns a detector object
- **Inheritance from a base class** (Hammer.js style): each gesture extends a `Recognizer` base class

For **what the detector exposes per frame**:

- **Events only**: detector returns discrete events; UI state must be computed elsewhere.
- **Events plus optional state**: detector returns events and an optional per-frame state object for continuous UI feedback.

**Decision: class implementing an interface; events plus optional state.**

**Pros and cons:**

#### Class implementing interface (chosen)

**Pros**

- Natural fit for the lifecycle (`update`, `reset`, internal state).
- Consumer implements only what is needed by the interface
- TypeScript checks the contract at compile time

**Cons**

- More verbose than a factory function for very simple detectors
- Classes are sometimes considered out of fashion in modern TS, though they remain the right tool for stateful objects with lifecycle.

#### Factory function

**Pros**

- More aligned with the broader functional trend
- No class syntax to learn

**Cons**

- The detector is stateful; encapsulating that in a closure is possible but harder to read than a class
- `update`, `reset` as separate functions returned by the factory are less ergonomic than methods on an object

#### Inheritance from base class

**Pros**

- Provides default implementations of common methods.

**Cons**

- Inheritance hierarchies are harder to evolve than interfaces
- Hammer.js follows this pattern: a custom recognizer extends
  the `Recognizer` base class and overrides methods like
  `process()`, `getTouchAction()`, and others. While workable,
  the per-recognizer touch-and-event lifecycle is tightly
  coupled to the base, which makes the entry barrier higher
  than necessary for the simpler body-gesture domain. An
  interface keeps the contract minimal: `update`, `reset`,
  `id`.

#### Events plus optional state (chosen)

**Pros**

- Detectors can drive both discrete actions (events) and continuous UI (state) without architectural gymnastics
- The Pinch progress ring implemented in Issue #2 already demonstrates the need for continuous state
- Detectors that have no continuous state simply return no state; zero overhead.

**Cons**

- The state shape is gesture-specific, so the recognizer can't type-check it generically
- Two output channels (events + state) add API surface compared to events alone.

### Block 3: Event model

**Considered options:**

For **event typing**:

- **String identifier + any data**: `recognizer.on("swipe", (e) => ...)`, event data is unknown to TypeScript (Hammer.js style).
- **Generic on() over a discriminated union**: `recognizer.on("swipe-left", handler)` — TypeScript narrows the event type by the string literal.

For **extension by consumers**:

- **Closed union**: only built-in events are typed; custom gestures fire untyped events
- **Module augmentation**: consumers declare their custom events in a `declare module "gesture-lib"` block, extending the union at compile time
- **Generic recognizer type parameter**: `new GestureRecognizer<MyEventMap>()` — every consumer configures the event map up front.

**Decision: generic on() over discriminated union; extension via module augmentation.**

**Pros and cons:**

#### String identifier + any data

**Pros**

- Familiar from DOM events and many JavaScript libraries.
- Trivially extensible to new event types.

**Cons**

- No compile-time check that the string is valid.
- No compile-time check on the event payload — every handler has to validate or assume.
- TypeScript users get nothing useful from the type system.

#### Generic on() over discriminated union (chosen)

**Pros**

- `recognizer.on("pinch-end", (e) => e.durationMs)` — the payload type is automatically narrowed
- Typos in event names are compile-time errors

**Cons**

- Requires generic type machinery in the implementation
- Non-TypeScript consumers don't benefit, but also don't lose anything.

#### Closed union for extension

**Pros**

- Simplest implementation — no module augmentation magic.

**Cons**

- Custom gestures cannot benefit from the typed-on() pattern.
- Inconsistent ergonomics: built-in gestures are typed, custom ones aren't.

#### Module augmentation for extension (chosen)

**Pros**

- Custom gestures get exactly the same type support as built-in ones
- Standard pattern in the TypeScript ecosystem (Express request augmentation, styled-components themes)
- The library stays closed for modification — consumers extend it without touching its files.

**Cons**

- Module augmentation is a somewhat advanced TypeScript feature — documentation has to explain it clearly.

#### Generic type parameter for extension

**Pros**

- Explicit about which events are expected.

**Cons**

- Forces every consumer to declare their event map up front, even if they don't add custom events
- Built-in event types have to be merged with custom ones manually
- Heavier ergonomics for the common case.

### Block 4: Library boundaries

**Considered options:**

For **detection-loop ownership**:

- **Library owns the loop**: library takes a video element and drives the detection loop internally.
- **Consumer owns the loop**: library exposes an `update()` method that the consumer calls per frame from their own loop.

For **input type**:

- **MediaPipe-specific** (`HandLandmarkerResult`): library is tied to MediaPipe types
- **Generic** (`unknown`): library accepts any input; each detector knows what shape it expects

**Decision: consumer owns the loop; input type is generic.**

**Pros and cons:**

#### Library owns the loop

**Pros**

- Lower-effort onboarding for consumers — give it a video, get events.
- Library can optimize the loop internally (frame skipping, throttling).
- This is what Hammer.js does: it attaches to an HTML element
  and intercepts touch/mouse events without exposing a per-
  frame loop to the consumer. The model fits the touch domain
  well because input events are sparse and event-driven.

**Cons**

- Couples the library to a specific detection backend (MediaPipe) and to the browser (HTMLVideoElement)
- Frameworks like React want to own their own loops, fighting that adds friction

#### Consumer owns the loop (chosen)

**Pros**

- Library is framework-agnostic: same `update()` works in React, Vue, vanilla JS, or even tests with mocked frames
- Consumers integrate the recognizer into whatever loop they already have

**Cons**

- Slightly higher onboarding cost: consumers must run their own loop
- Risk of consumer calling `update()` at irregular intervals, which can confuse time-based detectors (Pinch dwell, Swipe
  window). Mitigated by detectors using timestamps explicitly rather than assuming a fixed frame rate

#### MediaPipe-specific input type

**Pros**

- Compile-time type safety on the input
- Documentation is concrete about what to pass

**Cons**

- Hard-codes the library to one ML library

#### Generic input type (chosen)

**Pros**

- Library can be used with any landmark source: MediaPipe, TensorFlow.js, custom detection, mocked data
- Each detector casts to what it actually needs, keeping the responsibility local
- Future pose-based detectors fit the same API without changes

**Cons**

- Less type safety at the recognizer boundary — consumers can pass arbitrary objects
- Detectors have to be defensive about the input shape they receive (null checks, missing-landmark guards)

## Consequences

- The library can be implemented as a small core (the recognizer) plus separate gesture modules, each importable individually
- New gestures fit the same `GestureDetector` interface
- Documentation must cover:
  - Quickstart with the recognizer + a few built-ins
  - The `GestureDetector` interface
  - Module augmentation for custom event types
  - Per-gesture options reference
- The four built-in gestures (Pinch, Swipe, Pause, Pointing)
  exercise different event shapes: held-with-state (Pinch),
  transient-one-shot (Swipe), held-with-flag (Pause), and
  continuous-stream (Pointing). The API has to handle all four;
  the discriminated-union event model does.
