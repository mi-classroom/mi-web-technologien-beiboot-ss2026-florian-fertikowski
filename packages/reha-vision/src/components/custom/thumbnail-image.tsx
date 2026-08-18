"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ThumbnailImageProps {
  src: string | undefined;
  className?: string;
  /** Applied directly to the <img> element, e.g. for hover transforms. */
  imgClassName?: string;
}

/**
 * Image with graceful fallback to a no image message  if `src` is
 * missing or fails to load (404, not yet generated/uploaded).
 * Shared by WorkoutCard (grid) and the exercise-list rows (list) —
 * both need the same "show the real thumbnail once it exists,
 * degrade cleanly until then" behavior, so the fallback logic
 * lives in one place instead of being duplicated.
 */
export function ThumbnailImage({
  src,
  className,
  imgClassName,
}: ThumbnailImageProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={cn("overflow-hidden bg-secondary", className)}>
      {showImage ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <div
          className={cn("flex h-full w-full items-center justify-center")}
          aria-hidden="true"
        >
          Kein Bild
        </div>
      )}
    </div>
  );
}
