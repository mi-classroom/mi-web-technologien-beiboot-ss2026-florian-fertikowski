import type {Exercise} from "../data/exercises.ts";

interface ExerciseCardProps {
    exercise: Exercise;
    highlighted: boolean
    index: number
    onSelect: (id: string) => void;
}

export function ExerciseCard({ exercise, highlighted, onSelect, index }: ExerciseCardProps) {

    return (
        <div
            key={exercise.id}
            onClick={() => onSelect(exercise.id)}
            data-exercise-id={exercise.id}
            className={
            "flex h-40 flex-col items-start justify-between border border-gray-200 shadow-md p-4 text-left transition cursor-pointer"
                + (highlighted ? "border border-cyan-400" : "")
            }
        >
            <div className="flex w-full items-center justify-between">
                <span className="text-xs">
                  {index + 1}
                </span>
            </div>
            <div>
                <div className="font-medium">{exercise.name}</div>
                <div className="text-xs">
                    {exercise.durationSeconds}s
                </div>
            </div>
        </div>
    )
}