# ADR-0001: Use MediaPipe Tasks Vision for body tracking

* Status: accepted
* Workload: 3h
* Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
* Issue: [1](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/1)
* Date: 2026-05-17

## Context

The spike requires a browser-based ML library that can detect body
data (e.g. hand landmarks, full-body pose, gestures) from a webcam
stream in real time. The final library will expose these as web
events, so the underlying ML stack should cover all three
modalities consistently and run with acceptable performance.

## Considered Options

- **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`)
- **TensorFlow.js** (`@tensorflow-models/pose-detection`,
  `hand-pose-detection`)

## Decision

We use **MediaPipe Tasks Vision**.

## Pros and Cons of the Options

### MediaPipe Tasks Vision

**Pros**

- One API surface across `HandLandmarker`, `PoseLandmarker` and
  `GestureRecognizer` -> the future library can expose all three
  modalities with consistent semantics.
- Pretrained `GestureRecognizer` with 7 gestures (Open_Palm,
  Closed_Fist, Pointing_Up, Thumb_Up, Thumb_Down, Victory,
  ILoveYou) means meaningful high-level events can ship without
  training custom models.
- WASM runtime with GPU delegate gives stable 50 FPS for Pose
  and ~30 FPS for Hand / Gesture in early tests.
- Actively maintained by Google, clean TypeScript types,
  thorough documentation.

**Cons**

- Multi-person pose requires the heavier model variants; the
  Lite variant currently used is single-person only.
- Custom gestures require MediaPipe Model Maker, a Python
  pipeline outside the browser stack — the 7 built-in classes
  are the practical ceiling without that investment.
- Bundle is not tiny: WASM runtime and model files are loaded
  from CDN at runtime, adding a few seconds of startup latency
  on first use.

### TensorFlow.js

**Pros**

- More flexible for custom models — TF.js can load arbitrary
  models that we train or fine-tune ourselves.
- Larger ecosystem of pretrained models beyond body tracking

**Cons**

- Separate packages with different API conventions
- No pretrained gesture classifier comparable to MediaPipe's
  `GestureRecognizer` -> we would have to train one ourselves
- More setup boilerplate per model (backend selection, model
  loading, etc.) than the unified MediaPipe API.