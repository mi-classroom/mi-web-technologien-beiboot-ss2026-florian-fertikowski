# ADR-0010: Pointing detection algorithm

- Status: accepted
- Workload: 1.5h
- Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
- Issue: [3](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/3)
- Date: 2026-05-XX

## Context

The gesture vocabulary
([gesture-vocabulary.md](../gesture-vocabulary.md)) selects
pointing — index finger extended, other fingers curled — as the
gesture for "Select / focus". Unlike the three previous gestures
in the library (Pinch, Swipe, Pause), Pointing has a
fundamentally different output shape:

- Pinch and Pause emit two events bracketing a held state (start, end).
- Swipe emits a single event when motion completes.
- Pointing emits a **continuous stream of position events** while the pose is held: start, then many move events, then end.

Two design questions follow:

1. **How are move events emitted?** On every frame while
   pointing, or only when the position changes meaningfully?
2. **Should the position be smoothed?** The index fingertip is
   the noisiest landmark in the hand model (Issue #1 finding —
   stretched fingers visibly jitter). Without smoothing, the
   reported cursor would zigzag distractingly.

## Considered Options

For **event emission frequency**:

- **One event per frame** while the gesture is active.
- **Throttled emission** based on either a time interval (e.g.
  every 50 ms) or a position-delta threshold.

For **position smoothing**:

- **No smoothing**: report the raw index-tip position each frame.
- **EMA smoothing** with a configurable alpha factor.

For **gesture-conflict handling**:

- **Allow concurrent pointing on multiple hands** — each hand
  could be its own cursor.
- **One hand at a time** — first hand to satisfy the pose owns
  the gesture until release.

## Decision

**One event per frame** while the gesture is active. Throttling
is the consumer's job, not the library's.

**EMA smoothing** of the position with a configurable alpha
(default 0.5, lower = more stable, 1.0 disables smoothing).

**One hand at a time** drives the gesture, consistent with Pause.

The gesture's three event types — `pointing-start`,
`pointing-move`, `pointing-end` — each carry an `x` and `y`
position. The end event additionally carries a `durationMs`, like
`pinch-end` and `pause-end`.

## Pros and Cons of the Options

### Event emission frequency

#### One event per frame (chosen)

**Pros**

- Matches the model of DOM `mousemove` events — consumers
  recognize the pattern and know to throttle themselves if
  needed.
- The library makes no assumption about what the consumer wants
  to do with the position (a UI consumer might animate at 60 FPS,
  an analytics consumer might log every sample).
- Throttling at the consumer side is one `requestAnimationFrame`
  or `setTimeout` call — not significant burden.

**Cons**

- A naive consumer that updates React state on every event will
  trigger 30 FPS re-renders.
- The hook (use-gesture-recognizer.ts) mitigates this by
  applying a position-delta threshold before pushing into React
  state. That is a _demo-side_ concern, not a library concern.

#### Throttled emission

**Pros**

- The library would dampen the re-render problem for unaware
  consumers.

**Cons**

- The library would impose a policy that consumers cannot opt
  out of without modifying internals. A higher-frequency
  consumer would have no recourse.
- The optimal throttle depends on the consumer (UI vs. data
  collection vs. games), and the library has no way to know.

### Position smoothing

#### No smoothing

**Pros**

- The library reports what the underlying ML library reports.
  Pure pass-through.
- Lower latency: no smoothing lag.

**Cons**

- The index tip is one of the jitteriest landmarks in MediaPipe's
  hand model (Issue #1). The cursor would visibly zigzag.
- Every consumer would re-implement smoothing themselves.

#### EMA smoothing with configurable alpha (chosen)

**Pros**

- Sensible default behavior — the cursor moves smoothly with no
  consumer effort.
- One parameter (alpha) is a simple knob for the speed/stability
  trade-off, mirrored from the Pinch smoothing parameter.
- Setting alpha to 1.0 disables smoothing, so consumers who want
  raw positions can have them.

**Cons**

- Adds latency proportional to (1 / alpha). At alpha = 0.5,
  the cursor lags by roughly two frames when the finger moves
  rapidly. Acceptable for UI cursoring but noticeable if you
  pay attention.
- Two correct positions are produced (smoothed for UI, raw if
  needed). The smoothed one is what the library emits. Consumers
  needing raw positions have to disable smoothing globally.

### Gesture-conflict handling

#### Allow concurrent pointing on multiple hands

**Pros**

- Two-cursor interactions become possible (drawing apps, multi-
  user setups).

**Cons**

- The "Select / focus" interaction in the gesture vocabulary
  assumes a single cursor. Adding a second cursor would require
  the UI to disambiguate.
- The pointer-events API in browsers does support multi-touch,
  but a hand-tracking cursor is rarely used that way in practice.
- Implementation complexity grows: per-hand state, per-hand
  cursor lifecycles.

#### One hand at a time (chosen)

**Pros**

- Matches user expectations from mouse/touchpad analogues — one
  cursor on screen.
- Consistent with Pause, which is also single-hand.
- Smaller implementation: a single ActiveState, not a Map.

**Cons**

- A two-handed user would have one hand silently ignored. In
  practice this is the expected behavior, not a problem.

## Algorithm sketch

Per frame:

```
If no hand is currently pointing:
  Scan hands for one that satisfies the *activate* criteria:
    - index extended above activateThreshold
    - middle, ring, pinky all curled below curledThreshold
  If found:
    Enter CANDIDATE phase, start dwell timer.

If a hand is currently pointing:
  Check whether it still satisfies the *release* criteria
  (looser thresholds — hysteresis).
  If not:
    If we were ACTIVE: fire pointing-end with last position
    and duration. Drop state.
  If yes:
    Update smoothed position via EMA.
    If CANDIDATE: check whether dwell time elapsed; if so,
      transition to ACTIVE and fire pointing-start.
    If ACTIVE: fire pointing-move with the current smoothed
      position.
```

The thumb is intentionally unchecked. People hold the thumb
differently when pointing — some tucked, some sticking out
"pistol-finger-style" — and constraining it would exclude valid
poses.

## Known limitations

### Z-projection ambiguity

Pointing relies on the same `isFingerExtended` check used by
Pause, which measures the 2D distance from tip to MCP. When the
index finger extends _into_ the camera (the user points "at the
screen" in 3D), the 2D projection collapses tip and MCP near
each other. The detector reads this as a curled finger and the
gesture does not trigger.

In practice the user has to keep the index roughly parallel to
the camera plane — pointing sideways or up rather than directly
toward the screen. The same issue does not affect Pause as
strongly because Pause requires all four non-thumb fingers
extended, and any one of them being parallel-to-camera is
enough for the gesture to register.

### Conflicts with neighboring gestures

Transitioning from one hand pose to another passes through
intermediate states that may briefly look like Pointing. For
example, the journey from Open Palm to Fist starts with
"everything extended" and ends with "everything curled" — the
middle of the transition has the index extended and others
curled, which is the Pointing pose.

The dwell time mitigates this: a 200 ms hold filters out
transient transitions. But fast transitions through the pose
can still produce a brief pointing-start / pointing-end pair.
The recognizer's mutual-exclusion-by-id mechanism means only
one gesture fires per frame from each detector, but cross-
detector conflicts (Pinch starting mid-transition, etc.) are
not handled by the library. Consumers handle disambiguation at
the application layer if needed.

## Default parameters

| Parameter                            | Default | Notes                                                   |
| ------------------------------------ | ------- | ------------------------------------------------------- |
| `indexExtendedThreshold`             | 0.7     | Same shape as Pause; may need lowering on smaller hands |
| `otherFingersCurledThreshold`        | 0.5     | The complement of extension                             |
| `releaseIndexExtendedThreshold`      | 0.55    | Hysteresis — looser than activate                       |
| `releaseOtherFingersCurledThreshold` | 0.6     | Hysteresis in the other direction                       |
| `dwellTimeMs`                        | 200     | Same as Pinch                                           |
| `smoothingAlpha`                     | 0.5     | Halfway between reactive (1.0) and stable (0.1)         |

## Consequences

- Pointing is the first gesture in the library that emits more
  than two events per gesture instance. The discriminated-union
  event model handles this naturally — adding three new event
  types is a localized change to `types.ts`.
- The hook layer (use-gesture-recognizer.ts in the demo) needs
  to mediate the high-frequency move events into React-state
  updates. The hook now applies a position-delta threshold
  before pushing into state — without it, the demo would
  re-render on every frame. This is good design from the
  library's perspective: the library produces clean signals,
  the hook chooses an appropriate render strategy.
- Pointing's interaction with the other library gestures is
  documented but not algorithmically resolved. This is
  consistent with the position established in
  [ADR-0008](./0008-library-api-design.md): the library
  does not enforce mutual exclusion between gestures, leaving
  conflict resolution to the consumer.
