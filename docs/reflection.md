# Issue #4 reflection: building a consumer app against the gesture library

- Issue: [4](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/7)
- App: `packages/reha-demo` — a hands-free navigation demo for a
  static rehab-exercise page (overview / detail / active-timer
  screens), using all four library gestures
- Related decision record: [ADR-0011](./adr/0011-context-filtering.md)

## Goal

Issue #3 produced a library with a documented, plug-in-style public API. This issue asked for the opposite perspective:
build something _against_ that API, as an external consumer would, and find out where it holds up and where it doesn't.

This document collects what came out of that exercise. One of these observations led to an actual library change (
context filtering, ADR-0011);
the others are documented as accepted limitations or consumer-side responsibilities, with the reasoning for not changing
the library included at this moment.

## The app

A three-screen static rehab-exercise page:

- **Overview** — grid of ten exercise cards. Pointing highlights a card, pinch opens it.
- **Detail** — full description of one exercise. Swipe browses to the previous/next exercise, pinch starts a timer.
- **Active** — countdown timer. Open-palm hold (Pause) pauses and resumes it; swipe aborts back to Detail.

All screens remain fully usable with a mouse; gestures are an alternative input, not the only one.

## Observations while building

### 1. Camera and detection setup wasn't obviously discoverable

Even having built the library, the first real question when starting the new app was "how do I actually get frames into
this?" — not because the library's `update(input, timestamp)` signature is unclear, but because there is no shipped
example of
the _other end_: loading MediaPipe, running a detection loop, and wiring a `<video>` element.
That boilerplate (FilesetResolver, `HandLandmarker.createFromOptions`, a `requestAnimationFrame` loop keyed on
`video.currentTime`) had to be written again, from scratch.

**Should camera/detection handling live inside the library?**

No — for the same reason established in
[ADR-0008](./adr/0008-library-api-design.md): the library takes `unknown` input on purpose so it stays independent of
any
specific vision model. Owning the camera would tie it to MediaPipe specifically and prevent consumers who want a video
file, a different hand-tracking model, or mocked landmarks for testing.

**Outcome: documented, not fixed.** The friction is real but doesn't justify a library API change. The cheaper fix is a
copy-pasteable quickstart in the library's documentation that shows the full camera-to-recognizer pipeline as an
example, not
as library code. (Not yet added, noted here as a follow-up.)

### 2. The same gesture needs different meanings per screen

This turned out to be the most substantial finding. `pinch-end` needs to mean "open the highlighted card" on Overview, "
start the
exercise" on Detail, and "toggle pause" on Active. The original API gives one global subscription per event type:

```ts
recognizer.on("pinch-end", (event) => {
  /* now what? */
});
```

Three ways to make this work were tried or considered, in this
order:

1. **Single handler with an internal `if (screen === ...)`
   switch.** Works, but reads `screen` from a closure that goes
   stale across renders unless mirrored into a ref — boilerplate
   that has to be repeated per handler.
2. **Register/unregister the handler when the screen mounts.**
   Scopes the subscription to the component lifecycle, but
   couples gesture semantics to mount/unmount timing, and
   duplicates subscription code for handlers shared across
   screens.
3. **A consumer-side "scoped handler" wrapper** around the
   recognizer, with a `contexts` list per handler and a manually
   maintained "active context" value that the wrapper checks
   before dispatching. This is what the first working version of
   `use-gesture-recognizer.ts` did.

Option 3 worked, but it was clearly re-implementing something every consumer with more than one screen or mode would
need. That
observation became the one API problem taken back into the library.

**Outcome: fixed in the library.** See "Chosen library change" below and [ADR-0011](./adr/0011-context-filtering.md) for
the
full comparison of alternatives.

### 3. Reading current app state from a gesture handler still needs a ref

Even after moving context filtering into the library, one remaining pattern didn't go away: the Overview screen's pinch
handler needs to know _which_ card is currently highlighted by pointing, to know what to open. Since the handler is
invoked
asynchronously by the recognizer, reading `highlightedId` directly from the component closure would see a stale value
from whenever
the handler was subscribed. The fix is the same one used elsewhere in this project (the detection loop, the earlier
gesture hooks): mirror the state into a ref that's updated on every render, and read the ref inside the handler.

**Outcome: accepted as a general React pattern, not a library problem.** Context filtering removes the need to branch on
_which screen_ a handler is for, but any handler that needs the _current value_ of some piece of UI state will always
need this
kind of ref, gesture library or not.

### 4. Pinch-start vs. pinch-end for "activate"

Deciding which pinch event should trigger an action was a small
but real UX judgment call, not just a technical one.

- `pinch-start` fires as soon as the dwell time elapses — feels
  fast, but a user who pinches briefly by accident (e.g. brushing
  fingers together while gesturing) triggers the action before
  they can back out.
- `pinch-end` fires only on release, after the user has seen the
  pinch-progress ring fill and can choose to open the hand again
  before release to cancel.

This demo uses `pinch-end` throughout for exactly that reason:
it gives the user an implicit way to cancel a pinch that fires
by accident.

### 5. Gesture accuracy: cross-triggering during Swipe

A fast swipe motion occasionally also fires `pinch-start` or `pause-start` briefly mid-motion. This matches a concern
already
raised speculatively in [ADR-0010](./adr/0010-pointing-detection.md) ("Conflicts with neighboring gestures") — confirmed
here in
practice rather than just in theory.

The cause is architectural, not a bug: all four detectors run independently on every frame
([ADR-0008](./adr/0008-library-api-design.md) explicitly chose not to enforce mutual exclusion between gestures).
A hand in fast motion passes through geometric configurations that can incidentally satisfy another gesture's activation
criteria for a
frame or two — e.g. thumb and index finger passing close together mid-swipe briefly looks like the start of a pinch.

**Outcome: documented, not changed.** Fixing this in the library would require either global gesture-conflict
resolution (a much
bigger design change than this project's scope) or per-gesture "suppress me while X is also active" logic that ties
detectors
together, undermining the plug-in independence that's central to the library's design.
A production app would need stricter behavior and implement its own short debounce or priority rule at the handler
level.

### 6. False-positive "Open Palm" with no hand in frame

The most involved investigation. `pause-start` and `pinch-start` fired periodically
even when no hand was intentionally shown to the camera.

Debugging happened in stages, each hypothesis narrowed by logging the raw `HandLandmarkerResult` before it reached the
recognizer:

1. **Initial guess: the model was reading a face as a hand.**
   Not confirmed by the data — the reported landmark position
   (bottom-center of frame, y ≈ 0.90-0.92) didn't match typical
   face framing.
2. **Raised `minHandDetectionConfidence` /
   `minHandPresenceConfidence`** from the MediaPipe default (0.5)
   to 0.7. This reduced the frequency but did not eliminate the
   false positive — still roughly one every few seconds.
3. **Hypothesis: MediaPipe's periodic re-detection cycle** (in
   `VIDEO` running mode, full palm detection doesn't run on every
   frame; a lighter tracker follows the last result and periodic
   full re-detection happens at intervals). The "every few
   seconds" cadence was consistent with this, but not confirmed
   independently.
4. **Actual cause, found by elimination:** the open collar of a
   polo shirt, sitting at the bottom of the camera frame. Closing
   the collar removed the false detections entirely.

**Outcome: not a library or MediaPipe bug — a framing issue.**
Worth keeping in the writeup for two reasons. First, it's a
reminder that a low-jitter, spatially stable false positive is
often a _specific real object_ in frame, and worth checking for
directly (cover the camera, remove objects near the frame edges)
before reaching for confidence-threshold tuning. Second, and more
relevant to the library's design: `gesture-lib` has no way to know
or care _what_ produced the landmarks it's given. A shirt collar
that geometrically satisfies "four fingers extended, thumb
abducted" produces a valid Pause event — correctly, according to
the detector's own logic. Input quality (camera framing, what's
visible in the background, clothing) is entirely the consumer's
responsibility, and no reasonable library-side check could
distinguish "a hand" from "a hand-shaped thing" without a much
more sophisticated (and heavier) verification step that this
library deliberately does not take on.

## Chosen library change

**Context filtering for event subscriptions.** `GestureRecognizer.on()` and `onAny()` gained an optional third argument,
`{ contexts?: readonly string[] }`, and the recognizer gained `setActiveContext(context: string | null)` /
`getActiveContext()`. A handler registered with `contexts` only fires while the recognizer's active context matches one
of the
listed values; handlers without `contexts` keep firing unconditionally, so every existing subscription (in the spike
demo, in earlier code) keeps working unchanged.

```ts
recognizer.on("pinch-end", openHighlighted, { contexts: ["overview"] });
recognizer.on("pinch-end", startExercise, { contexts: ["detail"] });
recognizer.on("pinch-end", togglePause, { contexts: ["active"] });

recognizer.setActiveContext("overview");
// ... later, on screen change:
recognizer.setActiveContext("detail");
```

Full comparison of alternatives (switch-in-handler,
register-on-mount, consumer-side wrapper) and the reasoning for
choosing library-level filtering over all three is in
[ADR-0011](./adr/0011-context-filtering.md).

## Summary

| #   | Observation                                        | Outcome                                                             |
| --- | -------------------------------------------------- | ------------------------------------------------------------------- |
| 1   | Camera/detection setup boilerplate not obvious     | Documented; quickstart example recommended, not a library change    |
| 2   | Same gesture needs different meaning per screen    | **Fixed** — context filtering added (ADR-0011)                      |
| 3   | Reading current app state in a handler needs a ref | Accepted — general React pattern, not library-specific              |
| 4   | pinch-start vs. pinch-end for "activate"           | Accepted — UX judgment call, both events already available          |
| 5   | Swipe occasionally cross-triggers Pinch/Pause      | Documented — consequence of ADR-0008's no-mutual-exclusion decision |
| 6   | Open Palm false-positive with no hand in frame     | Documented                                                          |
