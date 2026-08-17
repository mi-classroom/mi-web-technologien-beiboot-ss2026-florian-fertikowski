"use client";

/**
 * The large circular button: click-accessible equivalent of
 * pinch-to-start and pause-gesture-to-pause. States:
 *
 * - "idle": not started yet. Shows a play icon. The ring fills as
 *   `progress` rises from 0 toward 1 — driven by a held pinch's
 *   dwell progress while gesturing, static at 0 for a plain click
 *   (which starts immediately, no ring needed). Reaching 1 starts
 *   the timer (same effect as clicking). May periodically swap for
 *   a short pinch-gesture demo clip (scaled up while showing) —
 *   see session-view.tsx's rotation — but not while a real pinch
 *   is actually in progress, so the demo can't cover up genuine
 *   hold feedback.
 * - "running": timer counting down. Shows the remaining seconds
 *   and a clockwise-filling progress ring — same ring, now driven
 *   by countdown progress instead of pinch-hold progress. On hover
 *   (mouse only — touch/click works regardless of hover), swaps
 *   the number for a pause icon as a preview of what clicking will
 *   do. Click pauses. No gesture demo here — interrupting a live
 *   countdown with a video would hide information the user
 *   actually needs.
 * - "paused": shows a play icon (not hover-dependent — the paused
 *   state needs to be legible without guessing). Click resumes.
 *
 * Hover is a desktop-mouse nicety on top of an already-functional
 * click target, not a requirement — touch and click work in every
 * state regardless of hover.
 */

import { useState } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionControlButtonProps {
  state: "idle" | "running" | "paused";
  /**
   * 0..1. For "running"/"paused" this is countdown progress; for
   * "idle" this is pinch-hold progress (0 unless a pinch is
   * currently being held). Same visual ring either way.
   */
  progress: number;
  secondsLeft: number;
  onClick: () => void;
  demoVideoSrc?: string;
  isDemoing?: boolean;
}

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
  // Don't show the demo while a real pinch is actually filling the
  // ring — a video swapping in over genuine hold-progress feedback
  // would hide the one moment that feedback matters most.
  const showDemo =
    isDemoing && state === "idle" && progress === 0 && !!demoVideoSrc;
  const showRing = state === "running" || state === "paused" || progress > 0;

  const label =
    state === "idle" ? "Start exercise" : state === "paused" ? "Resume" : "Pause";

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
        showDemo ? "size-44 md:size-48" : "size-32 md:size-36",
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
          className="h-full w-full object-cover invert"
        />
      ) : (
        <>
          {showRing && (
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
            {state === "idle" && <Play className="size-10" fill="currentColor" />}
            {state === "paused" && <Play className="size-10" fill="currentColor" />}
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
