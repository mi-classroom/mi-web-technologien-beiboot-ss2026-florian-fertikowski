/**
 * Curated workouts — each a named, ordered list of exercise ids.
 * Deliberately static (no workout editor / builder in scope).
 *
 * Tags reflect "how far from the desk" rather than a body-area
 * taxonomy. The earlier tag scheme (Neck / Shoulders / Upper Back
 * / Chest) was built for a different exercise set and stopped
 * fitting once the exercise list was rebuilt around a single
 * stock-video set that includes leg and core movements alongside
 * shoulder ones — a body-area filter would have left some
 * categories nearly empty. "How far from the desk" ties directly
 * to the app's actual thesis: gesture control matters once you've
 * stepped away to make room for the exercise, not because your
 * hands happen to be busy.
 */
import { getThumbnailUrl } from "@/data/exercises";

export type WorkoutTag =
  "health" | "prevention" | "stretching" | "pregnancy" | "cardio" | "yoga";

export const WORKOUT_TAG_LABELS: Record<WorkoutTag, string> = {
  health: "Gesundheitstraining",
  prevention: "Präventives Training",
  stretching: "Stretching",
  pregnancy: "Schwangerschaft",
  cardio: "Cardio",
  yoga: "Yoga",
};

/** Display order for the filter bar. */
export const WORKOUT_TAGS_ORDERED: WorkoutTag[] = [
  "health",
  "prevention",
  "stretching",
  "pregnancy",
  "cardio",
  "yoga",
];

export interface Workout {
  id: string;
  name: string;
  description: string;
  exerciseIds: string[];
  tags: WorkoutTag[];
  thumbnailExerciseId?: string;
}

export const workouts: Workout[] = [
  {
    id: "full-set",
    name: "Full Set",
    description: "All ten, standing through floor — the complete routine.",
    exerciseIds: [
      "standing-windmill",
      "alternating-lunge-stretch",
      "side-bend",
      "cross-body-shoulder-stretch",
      "overhead-triceps-stretch",
      "forearm-circles",
      "childs-pose",
      "lying-trunk-rotation",
      "shoulder-stand",
      "glute-bridge",
    ],
    tags: ["health", "stretching"],
    thumbnailExerciseId: "side-bend",
  },
];

export function getWorkout(id: string): Workout | undefined {
  return workouts.find((w) => w.id === id);
}

/**
 * Resolves the thumbnail image URL for a workout's grid card.
 * Falls back to the first exercise in the list if no explicit
 * thumbnailExerciseId is set.
 */
export function getWorkoutThumbnail(workout: Workout): string | undefined {
  const exerciseId = workout.thumbnailExerciseId ?? workout.exerciseIds[0];
  if (!exerciseId) return undefined;
  return getThumbnailUrl(exerciseId);
}
