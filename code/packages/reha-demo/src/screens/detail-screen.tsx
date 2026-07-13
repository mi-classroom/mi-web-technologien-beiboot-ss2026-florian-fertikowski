/**
 * Detail screen: full description of one exercise, with previous /
 * next navigation and a "start" action.
 *
 * The parent decides what happens on start/back/next/previous —
 * this component just fires the callbacks.
 */

import type {Exercise} from "../data/exercises.ts";

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

            <main className="flex flex-1 flex-col items-center ">
                <div className={"flex flex-1 items-center justify-center"}>
                    <div className="max-w-xl text-center">
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
                </div>

                <div className={"flex gap-10"}>
                    <button
                        type="button"
                        onClick={onPrevious}
                        className="border px-4 py-2 text-sm hover:bg-black hover:text-white cursor-pointer"
                    >
                        &larr; Previous
                    </button>
                    <button
                        type="button"
                        onClick={onStart}
                        className="px-8 py-3 font-medium transition bg-black text-white cursor-pointer "
                    >
                        Start exercise
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        className="border px-4 py-2 text-sm hover:bg-black hover:text-white cursor-pointer"
                    >
                        Next &rarr;
                    </button>
                </div>
            </main>

            <footer className="flex items-center justify-between pt-6">

            </footer>
        </div>
    );
}
