# Desk Mode and Big Picture Mode: Scope and Justification

- Status: accepted
- Deciders: Florian Fertikowski
- Issue: [5](https://github.com/mi-classroom/mi-master-wt-beiboot-2026/issues/5)
- Date: 2026-08-18

## Context and Problem Statement

Having decided on Way A ([ADR-0012](0012-vision-app.md)), the application needed its own organizing idea, not just
a container for the library's gestures, but a "clearly recognizable design or conceptual idea". The starting point
was [Steam's Big Picture Mode](https://store.steampowered.com/bigpicture): an
application with two parallel, general-purpose interfaces, one desktop-style and one built for distance/controller use,
freely switchable at will, each a complete way to use the whole app. The question was whether that same symmetric
structure made sense here, and if not, what it should be replaced by.

## Decision Drivers

- Precise manipulation e.g. reordering a list via drag-and-drop, is something gesture control is
  genuinely worse at than a mouse.

## Considered Options

- Option 1 — Symmetric general-purpose modes (the original Steam-inspired idea): both Desk Mode and Big Picture Mode
  span the whole application, freely switchable at any time, each a complete way to use the app.
- Option 2 (chosen) — Desk Mode as the default for everything; Big Picture Mode scoped narrowly to just the workout
  session, entered and exited by explicit action (starting or ending a workout), not a general application-wide toggle.

## Decision Outcome

Chosen option: **Option 2 — a narrowly-scoped Big Picture Mode**, reached only by starting a workout session and left by
ending one.

Under Option 1, Big Picture Mode would have needed to cover browsing and reordering workouts by gesture too, precisely
the task gesture control handles worst. Building that well would have meant either accepting a genuinely worse
interaction for list management, or quietly falling back to hidden mouse-dependency inside a mode that's supposed to not
need one. Neither is honest to what the "stepped back from the desk" thesis actually claims. Scoping Big Picture Mode to
just the session means every screen it contains is a screen where distance-from-desk is actually true.

### Consequences

- Zhe two modes now map cleanly onto two different interaction qualities the tasks actually need:
  precision for setup, distance-tolerance for the session, instead of two arbitrary containers that happen to hold the
  same features twice.
- The app is visibly asymmetric, Desk Mode is comparatively plain, Big Picture Mode is where the
  interaction-design and visual polish concentrate. This is a deliberate trade-off, not an oversight, but it does mean
  the library's gestures are only ever showcased on one screen, not throughout the app.

## Pros and Cons of the Options

### Option 1 — Symmetric general-purpose modes

- Good, because one consistently-applied interaction paradigm across the whole app
- Bad, because it forces gesture control onto tasks it's genuinely bad at, for the sake of symmetry rather than because
  it serves the task.

### Option 2 — Narrowly-scoped Big Picture Mode (chosen)

- Good, because gesture control only ever appears where the underlying thesis — distance from the desk — is actually
  true.
- Good, because it keeps the accessibility guarantee achievable within the project's timebox.
- Bad, because it produces a visibly asymmetric application

## More Information

See [ADR-0012](0012-vision-app.md) for the Way A decision this builds on. The Desk Mode / Big Picture Mode visual
asymmetry noted above is discussed further in the project's reflection.
