# gesture-lib

TypeScript library for recognizing hand gestures
from MediaPipe-style landmark data. Built as a plug-in system: a
small `GestureRecognizer` core orchestrates any number of
`GestureDetector` instances, each implementing one gesture.

The library ships four built-in gestures (Pinch, Swipe, Pause,
Pointing) and lets consumers add their own without modifying the
library code.

## Installation

The library lives in `packages/gesture-lib` inside the project's
npm-workspaces monorepo. The demo (`packages/demo`) imports it
via the workspace reference `"gesture-lib": "*"`. From outside
this monorepo it is not currently published; check it out and
add it as a workspace or a local file dependency.

```bash
npm install
npm run build --workspace=gesture-lib
```

The library requires no runtime dependencies. MediaPipe (or any
other source of 21-landmark hand data) is a peer dependency of
the consumer, not of the library itself.

## Quickstart

```ts
import { GestureRecognizer } from "gesture-lib";
import { PinchGesture, SwipeGesture } from "gesture-lib/gestures";

// 1. Create the recognizer
const recognizer = new GestureRecognizer();

// 2. Register the gestures you want
recognizer.register(new PinchGesture());
recognizer.register(new SwipeGesture());

// 3. Subscribe to events
recognizer.on("pinch-start", (event) => {
  console.log(`Pinch started on hand ${event.handIndex}`);
});

recognizer.on("swipe-left", () => {
  console.log("Swipe left");
});

// 4. Feed it frames from your detection loop
function onFrame(handLandmarkerResult: unknown, timestamp: number) {
  recognizer.update(handLandmarkerResult, timestamp);
}

// 5. Dispose when finished (e.g. on unmount)
recognizer.dispose();
```

That's the whole flow: create, register, subscribe, update,
dispose.

## Core concepts

The library is built around three concepts:

### Recognizer

The `GestureRecognizer` is a small orchestrator. It holds
registered detectors, forwards every frame into each of them,
collects their events, and dispatches them to subscribers. It
knows nothing about which gestures exist; everything comes in
via `register()`.

### Detectors

A _detector_ is a class that implements the `GestureDetector`
interface. Each detector is responsible for one gesture: it
receives frames via its `update()` method and returns events
plus optional per-frame state.

The library ships four built-in detectors (see "Built-in
gestures" below). Consumers can also write their own (see
"Writing a custom gesture").

### Events

Each detector emits events of specific types defined as a
discriminated union (`GestureEvent`). Subscribers register
type-safe handlers via `recognizer.on(type, handler)`. The
handler's event parameter is typed to the exact event variant
for the given type — accessing `event.durationMs` on a
`pinch-end` handler works; accessing it on a `swipe-left`
handler is a compile-time error.

## API reference

### `GestureRecognizer`

The central orchestrator.

#### `new GestureRecognizer()`

Creates a new recognizer. No constructor parameters.

```ts
const recognizer = new GestureRecognizer();
```

#### `recognizer.register(detector): () => void`

Adds a `GestureDetector` to the recognizer. From this point on,
every frame fed via `update()` also flows into this detector.

Returns a function that unregisters the detector. Throws if a
detector with the same `id` is already registered.

```ts
const unregister = recognizer.register(new PinchGesture());
// later, if you want to remove this detector only:
unregister();
```

#### `recognizer.on(type, handler): () => void`

Subscribes to a specific event type. The handler is typed to the
matching event variant.

Returns a function that unsubscribes.

```ts
const unsubscribe = recognizer.on("pinch-end", (event) => {
  // event.type === "pinch-end"
  // event.durationMs is available and typed as number
  console.log(`Pinch held for ${event.durationMs}ms`);
});

// later:
unsubscribe();
```

Multiple subscribers per event type are supported; each is called
in the order it subscribed.

#### `recognizer.onAny(handler): () => void`

Subscribes to _all_ events from any detector. Useful for logging
or dispatching to a single switch statement.

```ts
recognizer.onAny((event) => {
  console.log(event.type, event);
});
```

#### `recognizer.update(input, timestamp): RecognizerFrameState`

Feeds a single frame into all registered detectors, dispatches
any events that fire, and returns the combined per-frame state.

`input` is typed as `unknown` so the library does not bind to any
specific ML library. The built-in detectors expect MediaPipe's
`HandLandmarkerResult` shape (an object with a `landmarks` array
of 21-point hand landmark arrays). If you use a different source,
make sure your data has the same structural shape, or wrap your
own detectors around the input type you actually pass.

```ts
const state = recognizer.update(handLandmarkerResult, performance.now());
```

The returned `RecognizerFrameState` has the form:

```ts
{
  detectors: {
    "pinch": { /* PinchState shape */ },
    // other detectors that produce per-frame state
  }
}
```

Each entry is keyed by the detector's `id`. Consumers cast the
value to the expected shape:

```ts
import type { PinchState } from "gesture-lib/gestures";

const pinch = state.detectors["pinch"] as PinchState | undefined;
if (pinch) {
  // pinch.hands gives current per-hand pinch progress
}
```

#### `recognizer.reset(): void`

Calls `reset()` on every registered detector. Useful when the
camera reconnects, the user changes modes, or you want to start
clean without disposing the recognizer.

```ts
recognizer.reset();
```

#### `recognizer.dispose(): void`

Releases all detectors and clears all subscribers. After
`dispose()` the recognizer is no longer usable; subsequent calls
throw.

```ts
recognizer.dispose();
```

### `GestureDetector` interface

The contract that every gesture implements.

```ts
interface GestureDetector<T = unknown> {
  readonly id: string;
  readonly inputKind?: "hands" | "pose" | "any";

  update(input: T, timestamp: number): GestureUpdate;
  reset(): void;
}

interface GestureUpdate {
  events: GestureEvent[];
  state?: unknown;
}
```

- `id` — unique per recognizer; used to key per-frame state.
- `inputKind` — informational for now; reserved for multi-input
  routing in future versions.
- `update()` — called once per frame; returns any events that
  fire plus optional per-frame state.
- `reset()` — clears internal state.

### `GestureEvent` discriminated union

All built-in event types:

| Type             | Payload                                  |
| ---------------- | ---------------------------------------- |
| `pinch-start`    | `handIndex, timestamp`                   |
| `pinch-end`      | `handIndex, timestamp, durationMs`       |
| `swipe-left`     | `handIndex, timestamp`                   |
| `swipe-right`    | `handIndex, timestamp`                   |
| `pause-start`    | `handIndex, timestamp`                   |
| `pause-end`      | `handIndex, timestamp, durationMs`       |
| `pointing-start` | `handIndex, timestamp, x, y`             |
| `pointing-move`  | `handIndex, timestamp, x, y`             |
| `pointing-end`   | `handIndex, timestamp, x, y, durationMs` |

Positions (`x`, `y`) are in normalized `[0, 1]` coordinates
aligned with the camera frame.

## Built-in gestures

All built-in gestures live behind the `gesture-lib/gestures`
subpath. Each is a class implementing `GestureDetector` and
takes an optional options object. Defaults work for typical
near-range hand-tracking setups; see `gesture-observations.md`
in the project docs for tuning advice.

```ts
import {
  PinchGesture,
  SwipeGesture,
  PauseGesture,
  PointingGesture,
} from "gesture-lib/gestures";
```

### `PinchGesture`

Thumb-tip touching index-tip, held briefly to count as
deliberate. Emits `pinch-start` on activation and `pinch-end`
on release.

```ts
new PinchGesture({
  activateThreshold: 0.3,
  deactivateThreshold: 0.45,
  dwellTimeMs: 200,
  smoothingAlpha: 0.4,
  id: "pinch",
});
```

Per-frame state shape (`PinchState`): `hands` array with phase,
dwell progress, and position per hand. See `gestures/pinch.ts`
for the full type.

### `SwipeGesture`

Brisk horizontal hand movement. Emits one `swipe-left` or
`swipe-right` event when the motion qualifies. No state output.

```ts
new SwipeGesture({
  bufferSizeMs: 600,
  minDistanceHandLengths: 0.6,
  minSpeedHandLengthsPerSec: 2.5,
  minStraightness: 0.7,
  cooldownMs: 400,
});
```

Direction note: the detector reports raw direction relative to
the input data. If the consumer's video is CSS-mirrored, the
labels may feel flipped — see ADR-0007 and the demo's App.tsx
for the recommended UI-level adjustment.

### `PauseGesture`

Open-palm hold (all four fingers extended, thumb abducted to
the side). Emits `pause-start` on activation and `pause-end`
on release.

```ts
new PauseGesture({
  activateExtendedThreshold: 0.6,
  releaseExtendedThreshold: 0.45,
  thumbAbductionThreshold: 0.35,
  dwellTimeMs: 250,
});
```

The thumb abduction check uses both distance _and_ direction
relative to the hand's long axis, which avoids false positives
when the thumb folds _over_ the palm. See ADR-0009.

### `PointingGesture`

Index finger extended, others curled. Emits `pointing-start`
on activation, `pointing-move` on every frame while held, and
`pointing-end` on release. All three events carry an `(x, y)`
position in normalized coordinates.

```ts
new PointingGesture({
  indexExtendedThreshold: 0.7,
  otherFingersCurledThreshold: 0.5,
  dwellTimeMs: 200,
  smoothingAlpha: 0.5, // 1.0 to disable smoothing
});
```

Position is smoothed via EMA. Consumers driving a cursor can use
the `(x, y)` directly. See ADR-0010 for the known limitation
when pointing directly at the camera (Z-projection issue).

## Writing a custom gesture

Implement `GestureDetector` and register the instance. The
recognizer treats custom detectors exactly like the built-in
ones.

### Step 1: Define your event type

Use TypeScript module augmentation to extend the event union
with your own event types. This gives you the same type-safety
as built-in events when subscribing via `recognizer.on()`.

```ts
// my-gesture.ts

import type { GestureDetector, GestureUpdate } from "gesture-lib";

// Augment the library's event map. The keys become valid event-
// type strings; the values become the payload types.
declare module "gesture-lib" {
  interface CustomGestureEventMap {
    "high-five": HighFiveEvent;
  }
}

interface HighFiveEvent {
  type: "high-five";
  handIndex: number;
  timestamp: number;
}
```

### Step 2: Implement the detector

```ts
export class HighFiveGesture implements GestureDetector<unknown> {
  readonly id = "high-five";

  update(input: unknown, timestamp: number): GestureUpdate {
    // Your detection logic here. Read landmarks from `input`,
    // decide whether the gesture fired this frame, and return
    // any events.

    const events = [];
    if (this.detectHighFive(input)) {
      events.push({
        type: "high-five" as const,
        handIndex: 0,
        timestamp,
      });
    }
    return { events };
  }

  reset(): void {
    // Clear any internal state.
  }

  private detectHighFive(_input: unknown): boolean {
    // ... your heuristic ...
    return false;
  }
}
```

### Step 3: Register and subscribe

```ts
recognizer.register(new HighFiveGesture());

recognizer.on("high-five", (event) => {
  // event.type === "high-five"
  // event.handIndex is available and typed
  console.log("high five!");
});
```

The library's core does not change in any way to support the new
gesture.
