"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Workout, WorkoutTag } from "@/data/workouts";
import {
  WORKOUT_TAG_LABELS,
  WORKOUT_TAGS_ORDERED,
  getWorkoutThumbnail,
} from "@/data/workouts";
import type { Exercise } from "@/data/exercises";
import { WorkoutCard } from "@/components/custom/workout-card";
import { Separator } from "@/components/ui/separator";
import { FilterChip } from "./filter-chip";
import { FunnelX } from "lucide-react";

interface WorkoutsListProps {
  workouts: Workout[];
  exercises: Exercise[];
}

/**
 * Stagger container for the grid. `staggerChildren` here is what
 * gives WorkoutCard's "show" variant its per-card delay — the
 * cards themselves don't set a delay, they inherit this timing via
 * Framer Motion's variant propagation.
 */
const gridContainerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05 },
  },
};

/**
 * Filterable workouts grid. The server component passes
 * all workouts + exercises down as props; this component owns the
 * filter state and does the (trivial, client-side) filtering.
 */
export function WorkoutsList({ workouts, exercises }: WorkoutsListProps) {
  const [activeTag, setActiveTag] = useState<WorkoutTag | "all">("all");

  const filtered = useMemo(() => {
    if (activeTag === "all") return workouts;
    return workouts.filter((w) => w.tags.includes(activeTag));
  }, [workouts, activeTag]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={activeTag === "all"}
          onClick={() => setActiveTag("all")}
        >
          Alle
        </FilterChip>
        {WORKOUT_TAGS_ORDERED.map((tag) => (
          <FilterChip
            key={tag}
            active={activeTag === tag}
            onClick={() => setActiveTag(tag)}
          >
            {WORKOUT_TAG_LABELS[tag]}
          </FilterChip>
        ))}
      </div>

      <Separator />

      {filtered.length === 0 ? (
        <div className="flex flex-col space-y-4 items-center text-muted-foreground text-sm">
          <div>
            <FunnelX height={30} width={30} />
          </div>
          <p>
            Es gibt noch keine Trainingseinheiten, die diesem Filter
            entsprechen.
          </p>
        </div>
      ) : (
        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((workout) => {
              const totalSeconds = workout.exerciseIds.reduce((sum, id) => {
                const ex = exercises.find((e) => e.id === id);
                return sum + (ex?.durationSeconds ?? 0);
              }, 0);

              const minutes = Math.round(totalSeconds / 60);

              return (
                <WorkoutCard
                  key={workout.id}
                  href={`/workouts/${workout.id}`}
                  name={workout.name}
                  thumbnailSrc={getWorkoutThumbnail(workout)}
                  exerciseCount={workout.exerciseIds.length}
                  minutes={minutes}
                />
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
