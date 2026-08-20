# reha-demo

A three-screen static rehab-exercise demo, built as `gesture-lib`'s first real external consumer (Issue #4) — a
deliberate stress-test of the library's public API, not a polished product.

## What it demonstrates

- **Overview** — a grid of exercise cards. Pointing highlights a card, pinch opens it.
- **Detail** — full description of one exercise. Swipe browses to the previous/next exercise, pinch starts a timer.
- **Active** — a countdown timer. Open-palm hold pauses and resumes it; swipe aborts back to Detail.

All four of the library's built-in gestures (Pinch, Swipe, Pause, Pointing) are used here. Every screen also remains
fully usable with a mouse.

## Running locally

`gesture-lib` needs to be built at least once before this app can import it (it consumes the built package, not the
source):

```bash
npm run build --workspace=gesture-lib   # skip if already built
npm run dev --workspace=reha-demo
```

Open the URL Vite prints (typically [http://localhost:5173](http://localhost:5173)).

This app requires camera permission and a browser with `getUserMedia` support (Chrome, Firefox, Edge).

## Why this exists

This app's job wasn't to be a good rehab app, it was to find out where `gesture-lib`'s public API held up under real use
and where it didn't, by actually building something against it rather than reasoning about the API in the abstract.
