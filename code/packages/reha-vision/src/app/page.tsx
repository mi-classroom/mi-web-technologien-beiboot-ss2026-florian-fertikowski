import { workouts } from "@/data/workouts";
import { exercises } from "@/data/exercises";
import { WorkoutsList } from "@/components/custom/workouts-list";

/**
 * Desk Mode home/the Workouts overview.
 * Server component that only resolves data; filtering interactivity lives in WorkoutsList (client component).
 * No camera, no gesture recognizer here by design, this is the "you're still at your desk" screen.
 */
export default function WorkoutsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Workouts</h1>
      </header>

      <WorkoutsList workouts={workouts} exercises={exercises} />
    </main>
  );
}
