"use client";

import { cn } from "@/lib/utils";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EndWorkoutButtonProps {
  onClick: () => void;
  demoVideoSrc?: string;
  isDemoing?: boolean;
}

/**
 * "End workout" button, click-accessible equivalent of
 * the fist-hold gesture. Its icon periodically swaps for a short
 * clip of the fist shape
 */
export function EndWorkoutButton({
  onClick,
  demoVideoSrc,
  isDemoing = false,
}: EndWorkoutButtonProps) {
  const showDemo = isDemoing && !!demoVideoSrc;

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-300 size-16 md:size-25",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full size-12 md:size-20",
        )}
        aria-hidden="true"
      >
        {showDemo ? (
          <video
            key={demoVideoSrc}
            src={demoVideoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <Square className="size-6 text-white fill-background md:size-8" />
        )}
      </span>
    </Button>
  );
}
