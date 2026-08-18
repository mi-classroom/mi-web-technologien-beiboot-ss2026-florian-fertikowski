/**
 * Active screen: exercise is currently in progress with a timer.
 *
 * Timer state lives in the parent so the parent can pause/resume
 * from a gesture handler. The screen just displays what it's told.
 */

import type { Exercise } from "../data/exercises.ts";

interface ActiveScreenProps {
  exercise: Exercise;
  /** Remaining seconds. */
  secondsLeft: number;
  paused: boolean;
  onFinish: () => void;
}

export function ActiveScreen({
  exercise,
  secondsLeft,
  paused,
  onFinish,
}: ActiveScreenProps) {
  const totalSeconds = exercise.durationSeconds;
  const progress = 1 - secondsLeft / totalSeconds;
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="flex h-full flex-col p-8">
      <header className="flex items-center justify-between pb-6">
        <button
          type="button"
          onClick={onFinish}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          &larr; End exercise
        </button>
        {paused && (
          <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs uppercase tracking-wider text-[var(--color-accent)]">
            Paused
          </span>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-medium">{exercise.name}</h1>
        </div>

        <div className="relative flex h-56 w-56 items-center justify-center">
          <svg
            className="absolute inset-0 -rotate-90"
            viewBox="0 0 200 200"
            width={224}
            height={224}
          >
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="var(--color-border)"
              strokeWidth={8}
              fill="none"
            />
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="var(--color-accent)"
              strokeWidth={8}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              style={{ transition: "stroke-dashoffset 250ms linear" }}
            />
          </svg>
          <div className="relative text-center">
            <div className="text-6xl font-semibold tabular-nums">
              {secondsLeft}
            </div>
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
              seconds
            </div>
          </div>
        </div>

        <p className="max-w-md text-center text-sm text-[var(--color-text-muted)]">
          {exercise.description}
        </p>
      </main>

      <footer className="pt-6 text-center text-xs text-[var(--color-text-muted)]">
        Timer runs down automatically. The exercise ends when it reaches zero.
      </footer>
    </div>
  );
}
