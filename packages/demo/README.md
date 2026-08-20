# Proof of Concept: Camera and Body Data in the Browser

This is a browser-based demo that turns webcam video into live body-tracking data using
MediaPipe Tasks Vision. Three switchable modes (Hands, Pose,
Gesture) render raw landmarks as an overlay and expose live
stats (FPS, inference time, raw JSON) in a debug panel.

This is a spike and not a library. Its purpose is to make the
data visible and observable.

The decisions behind the chosen stack and architecture are
documented as ADRs in [`docs/adr/`](./docs/adr/). The data quality
observations from the spike phase are in
[`docs/observations.md`](./docs/observations.md).

## Run locally

Requires Node.js

```bash
npm install
npm run dev
```

Open <http://localhost:5173> in a browser and allow camera access.
