# Data Quality Observations

> Recorded during the spike phase of Issue 1. This is not a systematic benchmark and was only tested with one user and one device

## Test Setup

- **Hardware:** ASUS Zenbook 14, AMD Ryzen 7 8840HS, Radeon 780M iGPU
- **Browser:** Firefox 150.0.3 (64-bit)
- **Webcam:** USB 2.0 FHD UVC WebCam, max. 1920×1080 (used at 1280×720)
- **Lighting:** Standard desk setup, artificial overhead light
- **Distances tested:**
  - Short: ~0.4 m (sitting directly in front of the camera)
  - Medium: ~1.5 m
  - Long: ~4 m (room limit)

## Stable

- **Hand and Gesture detection at short range (≤ 1 m)** is very
  reliable. Landmarks lock on instantly and stay attached through
  normal hand motion.
- **Pose detection is the most robust of the three modes.** It still
  produces a usable skeleton at 4 m, where Hand and Gesture have
  already stopped working.
- Switching between detection modes works cleanly: the previous
  detector is torn down, the new model loads in 3-4 seconds

## Unstable

- **Hand and Gesture beyond ~1.5 m**: detection rate drops noticeably.
  Landmarks flicker on and off frame-to-frame; gesture classification
  becomes inconsistent. At 4 m, Hand and Gesture stop producing
  results entirely.
- **Pose lags visibly behind motion.** Even though Pose runs at the
  highest FPS of the three modes (~50), the rendered skeleton trails
  the actual body more visibly than the hand skeleton does. The FPS
  counter overstates how "live" the model feels.
- **Lighting matters, but less than distance.** At ~1 m with dimmer
  lighting, hand detection is slightly worse but still usable. At
  ~2 m even in good lighting it is already fragile. Distance dominates
  lighting as a failure factor in this setup.

## Jitter

Holding a body part still in front of the camera reveals how much
the landmarks wobble between frames.

- **Hand / Gesture:** Mild jitter on landmarks with a relaxed open
  hand. Noticeably stronger jitter when the hand is in a pose where
  some fingers are extended and others curled — e.g. palm forward
  with only the index finger extended, the extended finger visibly
  vibrates frame to frame even when the hand is held still.
- **Pose:** Slightly stronger jitter overall than Hand, even in a
  static standing pose. Combined with the visible motion lag, this
  is the noisier model qualitatively.

The implication is the same in both cases: any library binding that
maps landmark positions directly to UI values (cursor position,
slider value, etc.) will feel shaky and will need a smoothing layer.

## Failure Cases

| Condition                                  | Observation                                                      |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Hand behind the other hand (palm occluded) | Sometimes recognized, sometimes lost                             |
| Thumbs Up from the front                   | Inconsistent recognition; classified more reliably from the side |
| Open Palm rotated sideways                 | Often lost — front-facing palm is the reliable case              |
| Fast hand motion                           | Landmarks visibly lag motion; brief gaps possible during sweeps  |
| Distance > 1.5 m (Hand / Gesture)          | Detection becomes unreliable                                     |
| Distance ≈ 4 m (Hand / Gesture)            | No detection at all                                              |

The rotation-sensitivity of the Gesture model is the most actionable
finding here: the same physical gesture is classified differently
depending on how the hand is oriented to the camera.

## Performance

Measured with the debug panel's FPS readout (EMA-smoothed) and
per-frame inference time, GPU delegate active.

### Baseline (one subject at ~1 m, single hand / full body in frame)

| Mode        | FPS | Inference per frame |
| ----------- | --- | ------------------- |
| Hands       | ~30 | ~30 ms              |
| Pose (Lite) | ~50 | ~20 ms              |
| Gesture     | ~30 | ~30 ms              |

### Effect of scene contents

| Scenario            | Hands FPS | Gesture FPS | Pose FPS |
| ------------------- | --------- | ----------- | -------- |
| No subject in frame | ~60       | ~60         | 47-51    |
| One hand in frame   | ~32       | ~32         | —        |
| Two hands in frame  | ~29-30    | ~29-30      | —        |
| Full body in frame  | —         | —           | 47-51    |

Two patterns stand out:

1. **Hand and Gesture FPS roughly halves when work appears.** With no
   detection the loop runs at ~60 FPS, and adding
   a hand drops it to ~32. A second hand costs only a small amount
   on top, so the per-frame cost is dominated by _running the model
   at all_ rather than by the number of detections.
2. **Pose is insensitive to whether a subject is present.** FPS stays
   in the 47-51 range either way.

### Surprise: Pose is faster than Hands

Pose tracks 33 landmarks vs. 21 for Hand, yet runs at a higher FPS
(50 vs. 30) and lower inference time (20 ms vs. 30 ms). The likely
explanation is that the Pose Lite model is smaller / more aggressively
optimized on this hardware than the Hand Landmarker. The visible
trade-off shows up qualitatively as the motion lag noted above —
Pose runs faster but feels less "live."

## Implications for the Library

These observations translate directly into requirements for the
future library API:

- **Smoothing is needed.** Raw landmarks have enough jitter on every
  model that direct UI binding would feel shaky. Smoothing should
  be on by default, with an opt-out for consumers that want raw data.
- **Confidence thresholds must be configurable.** Especially for
  gestures, where rotation sensitivity produces low-confidence
  results that should be filterable before being fired as events.
- **High-level events should debounce.** A single false-positive
- **Per-mode characteristics should be discoverable.** Pose runs
  fastest but lags; Hand / Gesture are sharper but die past ~1.5 m;
  Pose is the only option past 2 m. Users picking a modality
  need to know this.
- **Multi-modality is mode-exclusive in this spike.** Running Hand
  and Pose simultaneously would compete for the same WASM / GPU
  budget.
