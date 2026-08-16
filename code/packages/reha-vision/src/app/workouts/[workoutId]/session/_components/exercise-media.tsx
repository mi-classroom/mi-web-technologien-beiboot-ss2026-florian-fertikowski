"use client";

interface ExerciseMediaProps {
  videoSrc?: string;
  name: string;
}

/**
 * Shows an exercise's demo clip. Plays continuously across both session
 * screens ("detail" and "active") — the countdown lives in the
 * small circular SessionControlButton now, not as full-screen
 * text, so the video isn't competing with anything for attention
 * and can just stay up throughout.
 *
 * Video is silent, autoplaying, and looping by design — it's a
 * demonstration loop, not a tutorial with narration. See the
 * project's reflection notes on why a short muted loop was chosen
 * over a full instructional video.
 */
export function ExerciseMedia({ videoSrc, name }: ExerciseMediaProps) {
  if (!videoSrc) {
    return (
      <div className="text-8xl" aria-hidden="true">
        No Video
      </div>
    );
  }

  return (
    <video
      key={videoSrc}
      src={videoSrc}
      autoPlay
      muted
      loop
      playsInline
      aria-label={`Demonstration of ${name}`}
      className="h-130 w-auto rounded-2xl object-cover shadow-2xl"
    />
  );
}
