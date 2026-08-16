import { notFound } from "next/navigation";
import Link from "next/link";
import { getWorkout, workouts } from "@/data/workouts";
import { exercises } from "@/data/exercises";
import { DemoDisclaimer } from "@/components/custom/demo-disclaimer";
import { ArrowLeft } from "lucide-react";
import { ExerciseListEditor } from "@/app/workouts/[workoutId]/_components/exercise-list-editor";

interface PageProps {
  params: Promise<{ workoutId: string }>;
}

/**
 * Tells Next.js which [workoutId] values exist at build time.
 * Required for static export since there's no server at runtime to
 * resolve arbitrary dynamic segments, so every valid path has to
 * be known and prerendered up front. The workout list is a fixed,
 * known set, so this is exhaustive by construction.
 */
export function generateStaticParams() {
  return workouts.map((workout) => ({ workoutId: workout.id }));
}

/**
 * Exercise-list screen. Still Desk Mode (mouse/keyboard, no
 * camera). Shows the workout's exercises in their default order;
 * the user can drag to reorder and toggle exercises on/off before
 * starting. The actual reordering/toggling UI lives in the client
 * component below since it needs interactivity; this page just
 * resolves the data server-side.
 */
export default async function WorkoutDetailPage({ params }: PageProps) {
  const { workoutId } = await params;
  const workout = getWorkout(workoutId);
  if (!workout) notFound();

  const workoutExercises = workout.exerciseIds
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e) => e !== undefined);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <Link
          href="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft height={18} width={18} />{" "}
          <span className={"pt-0.5"}>Alle Workouts</span>
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">
          {workout.name}
        </h1>
        <p className="text-muted-foreground">{workout.description}</p>
      </header>

      <DemoDisclaimer />

      <ExerciseListEditor
        workoutId={workout.id}
        initialExercises={workoutExercises}
      />
    </main>
  );
}
