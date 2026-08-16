"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavArrowButtonProps {
  direction: "left" | "right";
  label: string;
  onClick: () => void;
  demoVideoSrc?: string;
  isDemoing?: boolean;
}

/**
 * Left/right buttons — click-accessible equivalent of the
 * swipe gesture. Periodically swaps its icon for a short looping
 * clip of the actual swipe gesture
 */
export function NavArrowButton({
  direction,
  label,
  onClick,
  demoVideoSrc,
  isDemoing = false,
}: NavArrowButtonProps) {
  const showDemo = isDemoing && !!demoVideoSrc;

  return (
    <Button
      variant="outline"
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full transition-all duration-300 size-28 md:size-32",
      )}
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
      ) : direction === "left" ? (
        <ChevronLeft className="size-15" />
      ) : (
        <ChevronRight className="size-15" />
      )}
    </Button>
  );
}
