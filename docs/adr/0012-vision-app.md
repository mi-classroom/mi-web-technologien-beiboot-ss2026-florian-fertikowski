# Choosing Way A (Vision Application) over Way B (Deepening)

- Status: accepted
- Workload: 20h
- Deciders: Florian Fertikowski
- Issue: [5](https://github.com/mi-classroom/mi-master-wt-beiboot-2026/issues/5)
- Date: 2026-08-18

## Context and Problem Statement

[Issue #5](https://github.com/mi-classroom/mi-master-wt-beiboot-2026/issues/5) offers two explicitly equally-weighted
paths for the remaining project work.

**Way A — the Vision Application:** build a complete application that shows what the library can do when given real
design attention — "durchdachte Interaktion, sauberes UX, ein Ergebnis, das Sie auch außerhalb der Veranstaltung zeigen
würden."

**Way B — the Deepening:** take a specific weakness surfaced while building and solve it properly — the issue names
performance under load, robustness/error tolerance of gesture detection, latency, accuracy in poor lighting,
accessibility, or a reworked gesture vocabulary as examples. "Kein neues Projekt, sondern echte Tiefenarbeit an einem
bestehenden Problem."

## Decision Drivers

- `reha-demo` (Issue #4) was built and documented as a **testbed**, not a product — its explicit purpose was finding API
  gaps, not demonstrating good interaction design. That leaves a question Issue #4 never tried to answer: what does the
  library actually enable once someone designs _for_ the experience, not just _against_ the API surface?
- Personal interest pointed toward interaction design, UX, and concept work over further systems-level tuning of
  gesture-detection internals.

## Considered Options

- Way A — Vision Application
- Way B — Deepening: gesture-detection robustness, especially during workouts and near-misses feedback.

## Decision Outcome

Chosen option: **Way A, the Vision Application**, implemented as `packages/reha-vision`.

The more interesting open question was: could the library support an application with a real, coherent point of view,
not just a functional demo of its API surface.

## Pros and Cons of the Options

### Way A — Vision Application

- Good, because it directly tests an open question Issue #4 didn't: what the library supports when the _application_,
  not the API, gets real design attention.
- Good, because it produces the kind of artifact explicitly asked for: "ein Ergebnis, das Sie auch außerhalb der
  Veranstaltung zeigen würden", which a narrow internal fix to gesture-detection thresholds would not, on its own.
- Good, because its scope is naturally bounded by the concept itself
- Bad, because it does not add measured, verifiable improvement to the library

### Way B — Deepening

- Good, because it's a clearer, more falsifiable kind of deliverable than a design judgment call
- Good, because the library still has gaps, e.g. near misses feedback, important when a gesture is attempted repeatedly
- Good, because the libraries robustness could be improved, especially important for running workout sessions.
- Bad, because it would not have produced a complete, demoable application — a real cost against the shared acceptance
  criterion that the result be something deployable and presentable in a short video.

## More Information

Full task definition: [Issue #5](https://github.com/mi-classroom/mi-master-wt-beiboot-2026/issues/5).
