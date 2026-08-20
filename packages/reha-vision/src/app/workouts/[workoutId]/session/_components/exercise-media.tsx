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
 * Height is viewport-relative (clamp between a floor and a
 * ceiling, scaling with vh in between) rather than a flat pixel
 * value. A fixed height that looks right on a large monitor eats
 * a disproportionate share of a smaller laptop screen — on a
 * 1920x1200 external display 520px is comfortable; on a 13"
 * laptop viewport (often 700-900px of *usable* height after
 * browser chrome) the same 520px alone can push the rest of the
 * content (title, description, control button) past the bottom of
 * the screen, since CornerFrame centers its content and clips
 * anything taller than itself.
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
      className="h-[clamp(12rem,34vh,28rem)] w-auto max-w-full rounded-2xl object-cover shadow-2xl mt-8"
    />
  );
}
