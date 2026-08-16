"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Reorder } from "framer-motion";
import { GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/data/exercises";
import { getThumbnailUrl } from "@/data/exercises";
import { ThumbnailImage } from "@/components/custom/thumbnail-image";
import { Switch } from "@/components/ui/switch";

interface ExerciseListEditorProps {
  workoutId: string;
  initialExercises: Exercise[];
}

/**
 * Drag-to-reorder, toggle-to-include exercise list for a workout.
 * Desk Mode only — this is exactly the kind of precise pointer
 * manipulation gesture control is bad at (see the project's
 * reflection notes), so it deliberately stays mouse/keyboard.
 *
 * On "Start", the chosen order + selection is frozen into the URL
 * (as a query param) and handed off to the session route, which
 * is where Big Picture Mode and the camera take over. Freezing
 * into the URL rather than e.g. global state means the ordering
 * this session locked in can't be mutated by a later visit to
 * this page while the session is still running.
 *
 */
export function ExerciseListEditor({
  workoutId,
  initialExercises,
}: ExerciseListEditorProps) {
  const router = useRouter();
  const [order, setOrder] = useState(initialExercises);
  const [enabled, setEnabled] = useState<Set<string>>(
    new Set(initialExercises.map((e) => e.id)),
  );

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = order.filter((e) => enabled.has(e.id)).length;

  const handleStart = () => {
    const selectedIds = order.filter((e) => enabled.has(e.id)).map((e) => e.id);
    const params = new URLSearchParams({ exercises: selectedIds.join(",") });
    router.push(`/workouts/${workoutId}/session?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount} von {order.length} Übungen ausgewählt
        </p>
        <Button size="lg" disabled={selectedCount === 0} onClick={handleStart}>
          Workout starten
        </Button>
      </div>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={setOrder}
        className="flex flex-col gap-2"
      >
        {order.map((exercise, index) => {
          const isEnabled = enabled.has(exercise.id);
          return (
            <Reorder.Item
              key={exercise.id}
              value={exercise}
              whileDrag={{
                scale: 1.03,
                boxShadow: "0px 0px 8px 6px rgba(0,0,0,0.06)",
                zIndex: 1,
              }}
              className={cn(
                "select-none rounded-lg",
                !isEnabled && "opacity-50",
              )}
            >
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                  delay: index * 0.04,
                }}
                className="flex items-center gap-3 overflow-hidden rounded-lg border border-border bg-card p-3"
              >
                <GripVertical
                  className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                  aria-hidden="true"
                />
                <ThumbnailImage
                  src={getThumbnailUrl(exercise.id)}
                  className="h-16 w-28 shrink-0 rounded-md"
                />
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {exercise.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {exercise.durationSeconds}s
                  </span>
                </span>
                <Switch
                  aria-label={`Include ${exercise.name}`}
                  checked={isEnabled}
                  onClick={() => toggle(exercise.id)}
                />
              </motion.div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}
