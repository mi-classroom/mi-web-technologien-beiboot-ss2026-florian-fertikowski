"use client";

import { cn } from "@/lib/utils";
import { Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EndWorkoutButtonProps {
  onClick: () => void;
  demoVideoSrc?: string;
  isDemoing?: boolean;
  className?: string;
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
  className,
}: EndWorkoutButtonProps) {
  const showDemo = isDemoing && !!demoVideoSrc;

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={onClick}
      className={cn(
        "relative z-10 bg-destructive/80 hover:bg-destructive/60 flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-300 size-16 md:size-[clamp(4rem,3.906vw,6.25rem)]",
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full size-12 md:size-[clamp(3rem,3.125vw,5rem)]",
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
            className="h-full w-full object-cover invert"
          />
        ) : (
          <Square className="size-6 text-white fill-background md:size-[clamp(1.5rem,1.25vw,2rem)]" />
        )}
      </span>
    </Button>
  );
}
