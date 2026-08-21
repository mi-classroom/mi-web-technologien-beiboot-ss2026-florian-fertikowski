# reha-vision

Gesture-controlled home workout application and the main deliverable of this repository. For the concept behind Desk
Mode and Big Picture Mode, see the [root README](../../README.md#about-this-project); this document covers running,
configuring, and deploying this specific package.

## Prerequisites

- A device with a camera and a modern browser (Chrome, Firefox, or Edge — all support `getUserMedia` and the
  WebM/VP9-with-alpha video format used by the gesture demo clips)
- Everything listed in the [root README's prerequisites](../../README.md#prerequisites)

## Environment Variables

Both are optional. The app runs with sensible defaults out of the box, pointing at the project's own asset bucket, so no
`.env` file is required just to get it running locally. Set these only if you're hosting your own copy of the media
assets.

| Variable                     | Purpose                                                                                                                                                     | Default                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_VIDEO_BASE_URL` | Base URL for exercise demo videos, thumbnails, and gesture-demo clips (see [Asset Pipeline](#asset-pipeline) for the expected folder layout under this URL) | the project's Cloudflare R2 bucket                                                                     |
| `NEXT_PUBLIC_MUSIC_URL`      | Background music track played during a workout session                                                                                                      | unset — no music plays, and the music visualizer doesn't render, but the rest of the app is unaffected |

These aren't secrets, they're public asset URLs that end up in the client bundle either way, env var or not. The
indirection exists so there's one place to change them, not to hide anything.

## Running Locally

From the repo root:

```bash
npm run build --workspace=gesture-lib   # skip if already built
npm run dev --workspace=reha-vision
```

Open [http://localhost:3000](http://localhost:3000). Grant camera permission when prompted to use Big Picture Mode —
Desk Mode (browsing and setting up workouts) doesn't need the camera at all.

## Asset Pipeline

Exercise videos, thumbnails, and gesture-demo clips are static files hosted on Cloudflare R2, referenced via
`NEXT_PUBLIC_VIDEO_BASE_URL`. Expected layout under that base URL:

```
<bucket>/
├── <exercise-id>.mp4          # exercise demo loops, e.g. standing-windmill.mp4
├── thumbnails/
│   └── <exercise-id>.jpg      # workout/exercise grid thumbnails
└── gestures/
    ├── pinch.webm              # gesture-demo clips (see below re: transparency)
    ├── fist.webm
    ├── swipe-left.webm
    └── swipe-right.webm
```

Exercise and workout metadata (names, descriptions, durations, which thumbnail represents which workout) live in code,
not a CMS — see `src/data/exercises.ts` and `src/data/workouts.ts`.