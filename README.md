# Beiboot Project 2026

Browser-based hand gesture recognition library, used in a gesture controlled rehabilitation/home workout app built on
top of it.
The project was developed as a semester-long companion project for the Web Technologies module at the TH
Köln ([@th-koeln](https://github.com/th-koeln)),
supervised by Prof. Christian Noss ([@cnoss](https://github.com/cnoss)).

The assignment: build a browser-based gesture recognition library using only a laptop's built-in camera and build at
least one real application on top of it.

**Techstack:**

- **Library:** Typescript, MediaPipe Tasks Vision
- **Vision-Project:** Typescript, React, Next.js, Tailwind, Shadcn, Framer Motion

For media licensing: see [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).

## About this Project

The work is organized as a sequence of GitHub issues, each documented with its own Architecture Decision Records: a
framework-free detection spike, a reusable TypeScript gesture library, and as final step a
gesture-controlled home workout application built to demonstrate what the library can do when given real design
attention, not just a functional demo of the API surface.

### The Spike — `packages/demo`

A framework-free exploration of [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe)'s Hand, Pose, and Gesture
Recognizer modes, built before any library abstraction existed. The question it answers: what can a browser, using
nothing but a laptop's built-in camera, actually detect reliably? Everything downstream, the library's design, its
vocabulary and its API, is grounded in what this spike found actually worked.

### The Library — `packages/gesture-lib`

A framework-agnostic, plug-in-style gesture recognition library as the technical core of the whole project. The library
is at its core shaped by two ideas:

- **A concrete anchor scenario** The gesture vocabulary was originally designed around a single use
  case: shoulder/neck rehabilitation exercises. A scenario where a user is away from the desk and his hands may be
  occupied or their attention on their own
  body rather than the screen.
- **Context filtering.** The same physical gesture can mean something different depending on what's currently on
  screen, a pinch that opens something on an overview screen shouldn't necessarily do the same thing on a detail
  screen. Instead of pushing every consumer toward a giant switch statement the library resolves it internally via a
  context prop
- The library ships with a small built-in vocabulary and is genuinely extensible:
  its `HAND_LANDMARKS` constants and `GestureDetector` interface are public, so a consumer can write an entirely new
  gesture without touching the library's internals. `reha-vision`'s Fist gesture (see below) is built exactly this way,
  as a working demonstration of that path. See [`packages/gesture-lib/README.md`](packages/gesture-lib/README.md) for
  the full API reference and a walkthrough of writing a custom gesture.

### Reha Demo — `packages/reha-demo`

A Functional Demo as the library's first real consumer, built specifically to test its **public API**. The goal was to
find out whether the API was actually sufficient and pleasant to build with once someone tried to build something real
on top of it, rather than relying on assumptions made while writing the library itself.

### Reha Vision — `packages/reha-vision` (main deliverable)

Inspired by [Steam's Big Picture Mode](https://store.steampowered.com/bigpicture): two general-purpose modes
spanning the whole application, freely switchable at any time; a desktop-style mode, and a "big picture"
mode, as two equally broad lenses on the same app.

That symmetry didn't hold up. Big Picture Mode/Gesture Control isn't a second, general-purpose way to do everything the
app does, and it shouldn't be. It should address the one area where the actual pain point arrives: the workout session
itself, the
moment someone has stepped back from the screen, to do his exercise. Everything else, browsing workouts, reordering and
selecting exercises, has no
reason to be anything other than an ordinary desktop interface. What emerged is not two co-equal modes but a primarily
desktop application with one deliberately narrow gesture-controlled mode, scoped to exactly where it's needed:

- **Desk Mode** — browsing workouts, reordering and selecting exercises via drag-and-drop. Ordinary mouse/keyboard
  interaction, because precise list manipulation is exactly the kind of task gesture control is bad at.
- **Big Picture Mode** — the workout session itself, controlled by hand gestures, designed to be usable from a few steps
  back from the screen. Reached by explicitly starting a workout, not through any general mode switch.

Every gesture in Big Picture Mode also has a full click/keyboard equivalent. Gesture control is at its core an
alternative input
method, not a replacement/requirement. This keeps the app usable without a working camera, and for anyone who'd rather
not use
gestures at all.

Other notable piece: a rotating on-screen demo that teaches each gesture in place (shown at the exact control it
applies to, not only in a separate legend)

#### Implemented Gestures

| Gesture      | What it does                             |
| ------------ | ---------------------------------------- |
| Pinch (hold) | Start the current exercise               |
| Swipe        | Move to the next / previous exercise     |
| Open palm    | Toggle pause / resume during an exercise |
| Pointing     | Adjust volume                            |
| Fist (hold)  | Confirm ending the workout session       |

The first four gestures come from `gesture-lib`'s built-in vocabulary. Fist is implemented directly inside
`reha-vision`, as the working example of the library's public extension mechanism mentioned above.

## Project Structure

```
.
├── packages/
│   ├── gesture-lib/      # Core gesture recognition library (MediaPipe-based, framework-agnostic)
│   ├── demo/             # Original framework-free spike (Issue #1)
│   ├── reha-demo/        # First functional demo React consumer app (Issue #4)
│   └── reha-vision/      # Main deliverable (Issue #5): the gesture-controlled workout app
├── docs/
│   ├── adr/                        # Architecture Decision Records
│   ├── observations.md             # Raw MediaPipe detection-quality notes (Issue #1 spike)
│   ├── gesture-vocabulary.md       # Gesture vocabulary design (Issue #2)
│   ├── gesture-observation.md      # First implemented gestures' real-world behavior (Issue #2)
│   └── reflection.md               # Building a consumer app against the library (Issue #4)
├── package.json
└── README.md
```

## Prerequisites

- **Node.js 20.9 or later** (required by Next.js 16)
- **npm** (this repo uses npm workspaces; installing with a different package manager isn't tested)

## Getting Started

This is a npm-workspaces monorepo, one `npm install` at the root installs dependencies for every package.

```bash
git clone https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski.git
cd mi-web-technologien-beiboot-ss2026-florian-fertikowski
npm install
```

`gesture-lib` is consumed by the other packages as a **built** package, not directly from source, build it once before
running anything that depends on it (and again after pulling changes to it):

```bash
npm run build --workspace=gesture-lib
```

Then start the main application:

```bash
npm run dev --workspace=reha-vision
```

Open [http://localhost:3000](http://localhost:3000). The app works out of the box with sensible defaults, no `.env`
file is required just to get it running locally.

> For environment variables (self-hosting your own copy of the video/audio/thumbnail assets), see [
> `packages/reha-vision/README.md`](packages/reha-vision/README.md).

## Deployment

`reha-vision` is deployed as a static export via [Cloudflare Pages](https://pages.cloudflare.com/), with video, audio,
and thumbnail assets served
from a [Cloudflare R2 bucket](https://www.cloudflare.com/products/r2/).

The full walkthrough of build settings, required environment variables, and R2/CORS configuration lives in [
`packages/reha-vision/README.md`](packages/reha-vision/README.md).

- **Live demo:** [TODO: add deployed Cloudflare Pages URL]

## Documentation

| Document                                                           | Description                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`packages/gesture-lib/README.md`](packages/gesture-lib/README.md) | Library API reference, quickstart, and the guide for writing custom gestures                                                                                                                   |
| [`packages/reha-vision/README.md`](packages/reha-vision/README.md) | Setup, environment variables, and deployment for the main application                                                                                                                          |
| [`docs/observations.md`](docs/observations.md)                     | Raw MediaPipe detection-quality notes from the Issue #1 spike — distance limits, jitter, performance across Hand/Pose/Gesture modes — that shaped the library's smoothing and threshold design |
| [`docs/gesture-vocabulary.md`](docs/gesture-vocabulary.md)         | Maps generic UI interactions onto candidate gestures with a reliability assessment (Issue #2); documents which two (Swipe, Pinch) were selected for first implementation                       |
| [`docs/gesture-observation.md`](docs/gesture-observation.md)       | Real-world false-positive/false-negative behavior of the first implemented gestures (Issue #2) — e.g. rotation-sensitivity, arc-motion swipe misses                                            |
| [`docs/reflection.md`](docs/reflection.md)                         | Reflection on building `reha-demo` against the library's public API (Issue #4) — six observations, one of which (context filtering) became an actual library change, see ADR-0011              |
| [`docs/adr/`](docs/adr/)                                           | Architecture Decision Records — the reasoning behind key technical and design decisions                                                                                                        |
| [`docs/issue-5-reflection.md`](docs/issue-5-reflection.md)         | Reflection on the Vision Application (Issue #5) _(to be added)_                                                                                                                                |

## License

Source code is MIT-licensed, see [`LICENSE`](LICENSE). Media assets (exercise videos, gesture-demo clips, background
music) are licensed stock content and are **not** covered by that license, see [
`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).

## Author

Built by **Florian Fertikowski** for the _Web Technologies_ module ("Beiboot" project) at **TH Köln**, Summer Semester
2026, supervised by **Prof. Christian Noss**. Created as a student assignment for academic evaluation.

## AI-Assisted Development

AI assistance (Claude, Anthropic) was used throughout this project's development, for implementation, debugging, and
documentation.
