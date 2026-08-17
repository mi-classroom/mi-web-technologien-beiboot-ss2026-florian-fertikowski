"use client";

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionControlButtonProps {
  state: "idle" | "running" | "paused";
  /** 0..1 countdown progress, only meaningful for "running"/"paused". */
  progress: number;
  secondsLeft: number;
  onClick: () => void;
  demoVideoSrc?: string;
  isDemoing?: boolean;
}

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Large central session control button: click-accessible equivalent of
 * pinch-to-start and pause-gesture-to-pause.
 *
 * States:
 *
 * - "idle": not started yet. Shows a play icon. Click starts the
 *   timer (same effect as pinch-end in the "detail" screen). May
 *   periodically swap for a short pinch-gesture demo clip (scaled
 *   up while showing)
 * - "running": timer counting down. Shows the remaining seconds
 *   and a clockwise-filling progress ring. On hover (mouse only —
 *   touch/click works regardless of hover), swaps the number for a
 *   pause icon as a preview of what clicking will do. Click pauses.
 *   No gesture demo here, interrupting a live countdown with a
 *   video would hide information the user actually needs.
 * - "paused": shows a play icon (not hover-dependent — the paused
 *   state needs to be legible without guessing). Click resumes.
 *
 */
export function SessionControlButton({
  state,
  progress,
  secondsLeft,
  onClick,
  demoVideoSrc,
  isDemoing = false,
}: SessionControlButtonProps) {
  const [hovered, setHovered] = useState(false);
  const showPauseIcon = state === "running" && hovered;
  const showDemo = isDemoing && state === "idle" && !!demoVideoSrc;

  const label =
    state === "idle"
      ? "Start exercise"
      : state === "paused"
        ? "Resume"
        : "Pause";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={label}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "border border-foreground/15 bg-foreground/5 hover:bg-primary text-foreground hover:text-background backdrop-blur-sm",
        "transition-all duration-300",
        showDemo ? "size-32 md:size-48" : "size-24 md:size-36",
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
      ) : (
        <>
          {(state === "running" || state === "paused") && (
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                strokeWidth={4}
                className="stroke-primary/15"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                strokeWidth={4}
                strokeLinecap="round"
                className="stroke-primary transition-[stroke-dashoffset] duration-200"
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              />
            </svg>
          )}

          <span className="relative z-10">
            {state === "idle" && (
              <Play className="size-10" fill="currentColor" />
            )}
            {state === "paused" && (
              <Play className="size-10" fill="currentColor" />
            )}
            {state === "running" &&
              (showPauseIcon ? (
                <Pause className="size-10" fill="currentColor" />
              ) : (
                <span className="text-3xl font-semibold tabular-nums">
                  {secondsLeft}
                </span>
              ))}
          </span>
        </>
      )}
    </button>
  );
}
