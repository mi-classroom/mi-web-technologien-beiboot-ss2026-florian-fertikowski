/**
 * Overview screen: grid of exercise cards.
 *
 * Consumers highlight a card via `highlightedId` and open one via
 * `onSelect`. The card layout uses `data-exercise-id` on each
 * clickable element so a cursor-based hit-test (from outside the
 * component) can identify what the user is pointing at.
 */

import type { Exercise } from "../data/exercises.ts";
import {ExerciseCard} from "../components/exercise-card.tsx";

interface OverviewScreenProps {
  exercises: Exercise[];
  highlightedId: string | null;
  onSelect: (id: string) => void;
}

export function OverviewScreen({
  exercises,
  highlightedId,
  onSelect,
}: OverviewScreenProps) {
  return (
    <div className="flex h-full flex-col w-screen">
      <header className="flex items-baseline justify-between p-10">
        <h1 className="text-3xl font-semibold">Shoulder & Neck</h1>
      </header>
      <div className="p-10 grid flex-1 grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3 lg:grid-cols-4">
        {exercises.map((exercise, index) => {
            const highlighted = highlightedId === exercise.id;
            return (
                <ExerciseCard
                    exercise={exercise}
                    highlighted={highlighted}
                    index={index}
                    onSelect={onSelect}
                />
            );
        })}
      </div>
    </div>
  );
}
