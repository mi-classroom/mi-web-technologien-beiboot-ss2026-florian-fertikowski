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
modalities consistently and run with acceptable performance
on mid-range hardware.

## Considered Options:

- **MediaPipe Tasks Vision**: Google's current vision pipeline,
  unified API across hands, pose, gestures.
- **TensorFlow.js**: runs similar underlying models but
  through TF.js wrappers in separate packages.

## Decision

We use **MediaPipe Tasks Vision** (`@mediapipe/tasks-vision`).

## Pros and Cons of the Options

**Positive**

- One API surface across `HandLandmarker`, `PoseLandmarker`,
  and `GestureRecognizer` -> the future library can expose all
  three with consistent semantics.
- Pretrained `GestureRecognizer` with 7 gestures
  (Open_Palm, Closed_Fist, Pointing_Up, Thumb_Up/Down,
  Victory, ILoveYou) means we can ship meaningful high-level
  events without training custom models.
- WASM + GPU delegate gives stable 50 FPS in early tests

**Negative**

- Multi-person pose requires the heavier model variant; the
  Lite variant we currently use is single-person only.
- Custom gestures require MediaPipe Model Maker, which is a
  Python pipeline outside the browser stack.
- Bundle is not tiny, WASM runtime and model files are
  loaded from CDN at runtime.