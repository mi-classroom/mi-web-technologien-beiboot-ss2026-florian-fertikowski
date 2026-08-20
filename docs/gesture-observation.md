# Gesture Detection Observations

> Recorded during the spike phase of Issue 2. This is not a systematic benchmark and was only tested with one user and one device

## Test setup

- **Hardware:** ASUS Zenbook 14, AMD Ryzen 7 8840HS, Radeon 780M iGPU
- **Browser:** Firefox 150.0.3 (64-bit)
- **Webcam:** USB 2.0 FHD UVC WebCam, used at 1280×720
- **Test distance:** ~0.4–0.5 m (sitting in front of the laptop)

## What works well

- Pinch with a frontal, deliberate hand. Triggers reliably.
- Swipe with a brisk horizontal motion. Once tuned, triggers consistently in both directions.
- Mutual non-interference between Pinch and Swipe
- Cooldown handling. After a Swipe fires, the cooldown prevents the same motion from re-firing

## False-positive modes

### Pinch fires on rotated closed hand

When the hand is rotated so the palm is not facing the camera
(sideways or palm towards the back) the 2D projection of thumb-tip
and index-tip collapses. In camera-space the two landmarks appear
close together, even though the fingers are not touching in 3D space.
The detector reads this as a pinch and fires.

Triggering this requires rotating the hand in a way that only rarely naturally
occurs and the added complexity would have not been justified by the rate
of occurrence in the test scenario and was documented as a known
limitation rather than fixed in this iteration.

## False-negatives

### Swipe missed when arc motion is too vertical

Natural arm motion when swiping pivots from the elbow or
shoulder, which adds a vertical component to what feels
subjectively like a horizontal motion. The strict
`|dx| > |dy|` horizontal-dominance check rejects this as
"vertical motion".

**Implication for the library:** the strict dominance check is likely too narrow for real-world use.
