# ADR-0011: Context filtering for event subscriptions

- Status: accepted
- Workload: 4h
- Decider: [Florian Fertikowski](https://github.com/florian-fertikowski)
- Issue: [4](https://github.com/mi-classroom/mi-master-wt-beiboot-2026/issues/4)
- Date: 2026-XX-XX

## Context

While building the reha-demo app in issue #4, one API friction
kept recurring across every screen: the same gesture had to mean
different things depending on which screen was active.

- On the _overview_ screen, `pinch-end` means "open the highlighted
  card".
- On the _detail_ screen, `pinch-end` means "start the exercise".
- On the _active_ screen, `pinch-end` means "toggle the pause".

Same event, three different actions, chosen by app state that the
library knows nothing about.

The library's original event model was: register once per event
type, handler fires on every occurrence.

```ts
recognizer.on("pinch-end", (event) => {
  /* now what? */
});
```

The consumer has three choices, all of them awkward.

## Considered Options

### Option A: single handler with an internal switch

The handler dispatches by app state:

```ts
recognizer.on("pinch-end", (event) => {
  if (screen === "overview") openHighlighted();
  else if (screen === "detail") startExercise();
  else if (screen === "active") togglePause();
});
```

### Option B: register/unregister handlers on screen change

Each screen owns its own handler subscription, mounted and unmounted
with the screen:

```ts
useEffect(() => {
  if (screen !== "detail") return;
  return recognizer.on("pinch-end", startExercise);
}, [screen]);
```

### Option C: consumer-side scoped-handler wrapper

A hook wraps `recognizer.on` and adds a `contexts` field to each
handler:

```ts
handlers: {
  "pinch-end": {
    contexts: ["detail"],
    handler: startExercise,
  },
}
```

The wrapper filters events against a current-context prop before
dispatching.

### Option D: library-side context filtering (chosen)

`recognizer.on()` gains an optional third argument:

```ts
recognizer.on("pinch-end", startExercise, { contexts: ["detail"] });
```

The recognizer holds a single `activeContext` string, set via a new
`setActiveContext()` method. Handlers with a `contexts` list only
fire when the active context matches one of their entries.

## Decision

**Option D**: add context filtering to the library.

Concretely:

- New method `recognizer.setActiveContext(context: string | null)`.
- Extended `on()` and `onAny()` signatures accept a third argument
  `{ contexts?: readonly string[] }`.
- Handlers without a `contexts` list fire in every context
  (backward compatible: all existing subscriptions keep working
  exactly as before).
- When the active context is `null` (the initial state after
  construction), all handlers fire regardless — a null context
  means "no filter".

The reha-demo's `use-gesture-recognizer.ts` hook becomes a thin
wrapper: it constructs the recognizer, forwards handlers with
their contexts to `on()`, and mirrors the React `activeContext`
into the library via `setActiveContext()` on every change. No
filtering logic in the hook itself.

## Consequences

### Immediate

- The reha-demo's `use-gesture-recognizer.ts` shrinks by ~30
  lines. Its filtering logic disappears; only lifecycle
  management remains.
- The library's public surface grows by one method
  (`setActiveContext`), one option field (`SubscribeOptions.contexts`),
  and one small type export (`SubscribeOptions`).
- The existing spike demo (`packages/demo`) is unaffected
  because it never sets a context — all its handlers behave
  exactly as before.

### For the future

- Apps with multi-mode UIs (games with menu/play/pause,
  presentations with slide/overview/notes, editors with
  select/edit/preview) can express their mode as a context and
  get free filtering.
- Apps without multiple modes ignore the feature entirely.
