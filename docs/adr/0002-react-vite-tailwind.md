# ADR-0002: Use React, Vite and Tailwind for the demo app

* Status: accepted
* Workload: 0,25h
* Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
* Issue: [1](https://github.com/mi-classroom/mi-web-technologien-beiboot-ss2026-florian-fertikowski/issues/1)
* Date: 2026-05-17

## Context

The spike needs a UI to display webcam output, an overlay with
landmark visualizations and a live panel to display detailed information. The choice of
UI stack affects how fast we can iterate and how confidently we can explain the code in review.

## Considered Options:

- **Vanilla TypeScript + Vite** — closest to the browser
  platform, minimal indirection, no framework overhead. The
  spike's logic is mostly DOM APIs (`<video>`, `<canvas>`,
  `getUserMedia`, `requestAnimationFrame`) which read cleanly
  without a framework.
- **React + Vite + Tailwind** — familiar stack for the author,
  faster iteration on the UI parts, Tailwind avoids CSS file maintenance.
- **Next.js** — adds SSR, routing and server components, none
  of which the spike needs. Server components and `"use client"`
  directives would actively get in the way of a webcam-only
  client app.
- **Astro** — strong for content-driven sites but overkill for
  a single-page real-time webcam app.

The spike will also produce code that should be transferable
to the future library (see ADR-0003). The UI stack choice must
not interfere with that.

## Decision

We use **React 19 + Vite + Tailwind CSS**. Next.js and Astro
are explicitly rejected. Vanilla TypeScript was a close
contender and would have produced slightly less code, but
React is the author's familiar territory and the explanation
quality in review is worth more than a few saved lines.

## Pros and Cons of the Options

**Positive**

- Fast iteration on UI components thanks to JSX and Tailwind.
- The author can explain and defend every line of UI code in
  a review.

**Negative**

- React's render model does not naturally fit a 30+ FPS update
  loop. We need to deliberately bypass state for per-frame
  stats (see ADR-0004), which is a non-obvious pattern that
  must be explained in code review.
- All React-related code (hooks, components) is throwaway when
  the library is extracted in the next issue. Only the
  framework-free detection layer survives (see ADR-0003).
- StrictMode double-mounting in dev requires care in effects
  that own external resources (webcam stream, MediaPipe
  instances).
