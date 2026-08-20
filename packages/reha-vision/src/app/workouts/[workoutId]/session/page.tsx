import { Suspense } from "react";
import { notFound } from "next/navigation";
import { workouts } from "@/data/workouts";
import { SessionView } from "@/app/workouts/[workoutId]/session/_components/session-view";

interface PageProps {
  params: Promise<{ workoutId: string }>;
}

/**
 * Same requirement as the workout-detail route: static export
 * needs every dynamic segment enumerated at build time.
 */
export function generateStaticParams() {
  return workouts.map((workout) => ({ workoutId: workout.id }));
}

/**
 * Server shell for the session route. Resolves and validates
 * `workoutId` at build time (via generateStaticParams + this
 * lookup), then hands off to the client-side SessionView for
 * everything interactive (camera, gestures, timer).
 */
export default async function SessionPage({ params }: PageProps) {
  const { workoutId } = await params;
  const exists = workouts.some((w) => w.id === workoutId);

  if (!exists) notFound();

  return (
    <Suspense fallback={null}>
      <SessionView workoutId={workoutId} />
    </Suspense>
  );
}
