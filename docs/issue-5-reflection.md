# Issue #5 reflection: building the Vision Application

- Issue: [5](https://github.com/mi-classroom/mi-master-wt-beiboot-2026/issues/5)
- App: `packages/reha-vision` — a gesture-controlled home workout application (Desk Mode + Big Picture Mode)
- Related decision
  records: [ADR-0012](./adr/0012-vision-app.md), [ADR-0013](./adr/0013-desk-mode-vs-big-picture-mode.md)

## What makes this application special

Most demonstrations of a gesture library boil down to "here are the gestures, here's a screen that reacts to them." The
goal here was to go a level past that: the Desk Mode / Big Picture Mode split isn't cosmetic, it's an actual claim about
_when_ gesture control is worth having, not just that it can be added.

Taking that claim seriously has a visible consequence: most of the app (Desk Mode) doesn't use gestures at all. That
might look like an odd choice for something meant to show off a gesture library, but the question here was: Does it add
value? Should it really be added everywhere, including tasks like drag-and-drop reordering that gesture control is
genuinely worse at, just because the capability exists?

The other piece worth naming is that gesture control was never allowed to be the _only_ way to do something in Big
Picture Mode, every control has a full click/keyboard equivalent, and the camera can be disabled outright without
losing functionality.

## The biggest challenge: resisting the pull to gesture-ify everything

The semester's assignment is fundamentally about a gesture library, which made the default assumption going into this
application feel almost automatic: more gesture control is a better demonstration of what the library can do. That
assumption had a real precedent behind it: `reha-demo` (Issue #4) used all four of the library's built-in gestures
across all three of its screens, gesture control as the primary interaction method throughout.

Following that precedent into `reha-vision` would have meant gesture-controlling the workout browser and the
drag-and-drop exercise list too. Resisting that turned out to be the actual difficulty here, more than any single
technical problem: reordering a list precisely is a task gesture control is straightforwardly worse at than a mouse.
Accepting that meant accepting that most of the app's screen time, Desk Mode, would use no gesture control at all, which
felt, at least at first, like working against the
point of the assignment rather than serving it.

The resolution was recognizing that "showing the library well" and "using the library everywhere" aren't the same goal,
the stronger submission is the one where gesture control only shows up where it's genuinely the better tool for the
task.

See [ADR-0013](./adr/0013-desk-mode-vs-big-picture-mode.md) for the resulting scope decision.

## Smaller decisions worth recording

**Teaching gestures without burying the point of gestures.** Making every gesture click-accessible had an unplanned side
effect: the click controls became legible enough that a first-time visitor could finish a whole session without ever
noticing gesture control was an option. The fix was a rotating on-screen demo, each control periodically swaping its icon
for a short clip of the actual hand gesture, one control at a time, delayed a few seconds after the screen loads and
paused entirely while the mouse is moving, so it doesn't compete with someone who's already exploring on their own.
