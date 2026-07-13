/**
 * Detail screen: full description of one exercise, with previous /
 * next navigation and a "start" action.
 *
 * The parent decides what happens on start/back/next/previous —
 * this component just fires the callbacks.
 */

import type { Exercise } from "../data/exercises.ts";

interface DetailScreenProps {
  exercise: Exercise;
  positionLabel: string; // e.g. "3 of 10"
  onBack: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onStart: () => void;
}

export function DetailScreen({
  exercise,
  positionLabel,
  onBack,
  onPrevious,
  onNext,
  onStart,
}: DetailScreenProps) {
  return (
    <div className="flex h-full flex-col p-8">
      <header className="flex items-center justify-between pb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          &larr; Back to overview
        </button>
        <span className="text-xs text-[var(--color-text-muted)]">
          {positionLabel}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="max-w-xl text-center">
          <div className="mb-6 text-8xl">{exercise.icon}</div>
          <h1 className="mb-4 text-4xl font-semibold">{exercise.name}</h1>
          <p className="mb-8 text-lg text-[var(--color-text-muted)]">
            {exercise.description}
          </p>
          <div className="text-sm text-[var(--color-text-muted)]">
            Suggested duration:{" "}
            <span className="text-[var(--color-text)]">
              {exercise.durationSeconds} seconds
            </span>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between pt-6">
        <button
          type="button"
          onClick={onPrevious}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)]"
        >
          &larr; Previous
        </button>
        <button
          type="button"
          onClick={onStart}
          className="rounded-lg bg-[var(--color-accent)] px-8 py-3 font-medium text-[var(--color-bg)] transition hover:bg-[var(--color-accent-strong)]"
        >
          Start exercise
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-hover)]"
        >
          Next &rarr;
        </button>
      </footer>
    </div>
  );
}
