# Gesture Vocabulary

This document maps generic UI component interactions onto possible gestures and assesses how reliably each could be implemented with [the data observed in Issue #1](./observations.md).
This follows the decision in [ADR-0005](./adr/0005-gesture-vocabulary-context.md): entries are generic, with a column showing how each maps onto the rehabilitation reference scenario.

Distances follow the ranges established in Issue #1:

- **near range** roughly 0.4–1.5 m (hand and gesture detection reliable)
- **far range** 2–4 m (only pose detection produces usable data)

## Vocabulary

| #   | Generic interaction    | Near-range gesture                                    | Data & reliability (near)                                                    | Far-range gesture                        | Data & reliability (far)                                                                                | Rehab example                 |
| --- | ---------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | Next                   | Swipe right with hand                                 | Hand-x over time, robust                                                     | Swipe right with lower arm               | Wrist-x relative to elbow over time, robust; distinct from exercise motion via velocity threshold       | → Next exercise               |
| 2   | Back                   | Swipe left with hand                                  | as #1, symmetric                                                             | Swipe left with lower arm                | as #1, symmetric                                                                                        | Previous exercise             |
| 4   | Confirm                | Pinch (thumb + index, hold)                           | Tip distance + dwell, rotation-sensitive                                     | Either arm raised, elbow bent ~90°, held | Pose elbow angle from shoulder/elbow/wrist, held for dwell duration to distinguish from exercise motion | → Start exercise              |
| 4   | Pause                  | Open Palm hold                                        | MediaPipe gesture, frontal robust, rotation-sensitive                        | Both arms raised                         | Pose, very robust                                                                                       | Pause exercise                |
| 5   | Cancel                 | Wave away (hand fast to side)                         | Hand velocity, distinguishable from swipe via threshold                      | Arms crossed in front of chest           | Pose, robust but uncomfortable to hold                                                                  | Abort exercise                |
| 6   | Increase value         | Hand raised, held                                     | Hand-y position, gut messbar                                                 | Arm raised sideways                      | Pose, robust and unambiguous                                                                            | Extend rest timer             |
| 7   | Decrease value         | Hand lowered, held                                    | as #6, symmetric                                                             | Arm lowered                              | as #6, symmetric                                                                                        | Shorten rest timer            |
| 8   | Request help / context | Hand brought near face                                | Wrist-to-nose distance, intuitive but false-positive risk (e.g. fixing hair) | Hand held at head height                 | Pose wrist + nose, robust to 4 m                                                                        | Show exercise description     |
| 9   | Acknowledge            | Thumb up (brief)                                      | MediaPipe gesture, strongly rotation-sensitive (see Issue #1)                | Head nod                                 | Pose Face landmarks weak in Lite model, unreliable                                                      | Confirm feedback              |
| 10  | Select / focus element | Pointing index finger (index extended, others closed) | Posture from landmark angles, index-tip as cursor position                   | Arm extended toward target               | Pose wrist + shoulder vector, robust but coarse                                                         | Focus an exercise in the list |

## Reliability terms

For brevity, the table uses a small set of consistent terms:

- **robust** — landmark holds steadily across frames, gesture
  triggers reliably in repeated trials.
- **rotation-sensitive** — same physical gesture is detected
  inconsistently depending on hand or body orientation
  (specific Issue #1 observation, see observations.md).
- **dwell + threshold** — robustness depends on holding the
  gesture for a configured duration past a distance/position
  threshold, not on a single-frame snapshot.

## Implementation selection

Two gestures from this vocabulary are implemented in this issue.
The selected gestures are **Swipe left/right** (row #1, #2) and **Pinch + hold** (row #3) and were selected to have a dynamic gesture
(movement over time, direction, velocity) and a static gesture (state held for a duration). Both exercise different detection strategies.
