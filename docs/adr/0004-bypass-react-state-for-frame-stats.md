# ADR-0004: Bypass React state for per-frame stats

- Status: accepted
- Workload: 0.25h
- Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
- Issue: [1](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/1)
- Date: 2026-05-17

## Context

The detection loop produces frame statistics (FPS, inference
time, detection count, raw JSON result) at 30+ frames per
second. These stats are displayed in the debug panel and must
stay current with the live stream.

The default React approach would be to store stats in
`useState` and let React re-render the panel on every update.
At 30+ updates per second this causes a re-render storm: even
with the React Compiler memorizing components aggressively, the
panel itself and its consumers re-render constantly, which
competes with the detection work for the main-thread budget
and can degrade the very FPS we are trying to display.

## Decision

The debug panel **does not store frame stats in React state**.
Instead it exposes an imperative handle via
`useImperativeHandle` with an `update(stats)` method. The
caller (the detection loop, wired through `App.tsx`) writes
values directly into DOM nodes via refs and `textContent`.

The same pattern is applied to the detection loop hook itself:
props that change frequently (`frozen`, `onFrame`) are
mirrored into refs so the expensive detection effect does not
restart on every prop change.

## Pros and Cons of the Options

**Positive**

- The detection loop runs at full frame rate without
  triggering React renders.
- The debug panel can display very high-frequency updates
  (FPS, inference time) without any throttling logic.

**Negative**

- The pattern looks unusual to a reader who only knows
  "everything is state" React. Inline comments and this ADR
  are required to explain why.
- Imperative handles bypass React's data flow. Bugs in this
  area (stale refs, forgotten updates) cannot be caught by
  React's normal mechanisms.
