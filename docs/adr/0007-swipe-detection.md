# ADR-0007: Swipe detection algorithm

- Status: accepted
- Workload: 2h
- Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
- Issue: [2](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/2)
- Date: 2026-05-31

## Context

The gesture vocabulary (see
[gesture-vocabulary.md](../gesture-vocabulary.md)) selects Swipe
as the gesture for "Next" and "Back" navigation in the near
range. Swipe is structurally different from Pinch (ADR-0006):

- Pinch is a **stateful, held** gesture, a held condition that
  fires a start event and an end event.
- Swipe is a **transient, one-shot** gesture, a movement that
  has happened, fires a single event, and is then done.

This means Swipe needs a different detection structure than
Pinch's state machine. Distinguishing a deliberate swipe from
incidental hand motion is the central challenge: the algorithm
has to decide, frame by frame, whether the recent motion
constitutes an intentional gesture.

## Considered Options

For the detection structure:

- **State machine with explicit recording phase**
- **Sliding window over recent positions**

For the reference landmark:

- **Wrist (landmark 0)**
- **Index tip (landmark 8)**
- **Centroid of all landmarks**

For the qualifying criteria:

- **Distance**: fire when the hand has moved far enough.
- **Distance and speed**: also require the motion to be fast.
- **Distance + speed + straightness + horizontal dominance**: four independent checks that have to all pass.

## Decision

**Detection structure: sliding window.** A buffer of the most
recent positions (configurable, default 600 ms) is maintained per
hand. Every frame, the buffer is evaluated against the qualifying
criteria; if all pass, a `swipe-left` or `swipe-right` event
fires, the buffer is cleared, and a cooldown is set.

**Reference landmark: wrist (landmark 0).**

**Qualifying criteria: all four.** The detector requires
sufficient net distance, sufficient speed, sufficient straightness,
and that the motion is horizontally dominant over vertical motion.

## Pros and Cons of the Options

### Detection structure

#### State machine with recording phase

**Pros**

- Visually parallels the Pinch implementation: symmetric structure across the two detectors

**Cons**

- Requires an artificial "motion start" trigger, since the data has no natural state transition (a moving hand looks the same whether at the start, middle, or end of a swipe)
- Adds bookkeeping (state variables, transition guards) without a corresponding gain in detection quality
- The "is the motion ending now?" question is essentially the same evaluation as the sliding window does anyway

#### Sliding window (chosen)

**Pros**

- Matches the data
- Less code than the state-machine variant
- Cooldown after a trigger plus buffer-clear is a simple mechanism that prevents repeated firing on the same motion
- The window length is a single, intuitive knob

**Cons**

- The detector fires when the gesture is _complete_, not when it starts, so there is no equivalent of Pinch's "candidate" phase for UI feedback during the gesture

---

### Reference landmark

#### Wrist (chosen)

**Pros**

- Jitter is smaller than at the fingertips (Issue #1 observation)
- Naturally represents the whole hand as a unit, matching how users actually perform a swipe (whole-hand motion, not finger flick)
- Shared with the hand-length reference (wrist to middle MCP), so no extra landmark dependency

**Cons**

- Less visually intuitive than a fingertip when describing the gesture to a user

#### Index tip

**Pros**

- Visually salient: "swipe with your finger"
- Matches a common UI pattern from touchscreen swipes

**Cons**

- Subject to extended-finger jitter (Issue #1 observation)
- The position depends on which finger the user extends, which varies between people

#### Centroid of all landmarks

**Pros**

- Most robust to single-landmark noise

**Cons**

- Computationally heavier
- The improvement over wrist is small relative to the wrist's inherent stability

---

### Qualifying criteria

#### Distance only

**Pros**

- Simplest possible check

**Cons**

- Slow hand drift would qualify as a swipe, which is wrong
- No way to distinguish a wobbly side-to-side motion from a clean swipe

#### Distance + speed

**Pros**

- Excludes slow drifts
- Two intuitive parameters

**Cons**

- A back-and-forth motion that is fast and has high end-to-end distance still qualifies (e.g. waving away something)
- Vertical motion competes with horizontal motion

#### Distance + speed + straightness + horizontal dominance (chosen)

**Pros**

- Each criterion targets a specific failure mode and can be tuned independently
- Together they form a robust filter: a real swipe passes all four; incidental motion typically fails at least one
- The straightness criterion is the key non-obvious one, it catches "I swiped but also pulled back" cases that simpler rules miss

**Cons**

- Four tunable parameters instead of one or two
- Each parameter is a potential misconfiguration
- Some user-natural swipes have arc components large enough to fail the horizontal-dominance check

## Algorithm

Per frame, for each detected hand:

1. Append (wrist x, wrist y, hand-length, timestamp) to the buffer
2. Drop older buffer entries
3. If cooldown is active OR buffer has fewer than 2 entries, skip.
4. Compute over the buffer:
   - dx, dy (net displacement (last - first))
   - duration (time span of the buffer)
   - refHandLength (median hand-length across buffer entries)
   - dxNorm (hand-lengths)
   - speedNorm (hand-lengths per second)
   - totalPath (normalized sum of frame-to-frame distances)
   - straightness
5. Reject if:
   - not horizontal
   - not enough distance
   - not enough speed
   - not enough straightness
6. If both hands qualify in the same frame, pick the one with the larger dxNorm and ignore the other.
7. Fire swipe-left or swipe-right based on sign of dx.
8. Clear all hand buffers and set a cooldown on all hands.
