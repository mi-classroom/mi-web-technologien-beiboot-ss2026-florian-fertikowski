# ADR-0003: Keep the detection layer framework-free

* Status: accepted
* Workload: 2,5h
* Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
* Issue: [1](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/1)
* Date: 2026-05-17

## Context

The spike is one stage of a larger project. The end goal is a
browser library that exposes body data as native web events,
consumable by any web app regardless of framework. The spike
itself is built with React (see ADR-0002), but the future
library must not depend on React or any other UI framework.

If we mix framework-specific code into the detection logic
now, we will pay for it later: every React import in a
detection module is something we have to rewrite when
extracting the library.

## Decision

The detection layer (`src/detectors/`) is **strictly
framework-free**. It depends only on:

- TypeScript
- Browser APIs (`HTMLVideoElement`, `CanvasRenderingContext2D`,
  `requestAnimationFrame`)
- `@mediapipe/tasks-vision`

No React imports, no Tailwind utilities, no awareness of the
demo UI exist in this folder. The folder is the conceptual
seed of the future library.

React-specific concerns live in `src/hooks/` and
`src/components/`. These are explicitly disposable when the
library is extracted.

## Pros and Cons of the Options

**Positive**

- The detection layer can transfer to the library in the next
  issue with little to no rewrite.

**Negative**

- Some code is duplicated between the spike (the `useWebcam`
  hook) and the future library (which will need its own
  framework-free webcam handling). The duplication is small
  and accepted as the price of clean separation.
- The detection layer cannot use React's ergonomics (hooks,
  state, JSX) even where it might be nice. Lifecycle management
  is done manually via the `Detector` interface
  (`init`/`detect`/`draw`/`dispose`).
