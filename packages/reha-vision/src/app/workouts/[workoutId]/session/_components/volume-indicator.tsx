"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Pointer, Volume1, Volume2, VolumeX } from "lucide-react";

interface VolumeIndicatorProps {
  /** 0..1 */
  volume: number;
  onVolumeChange: (volume: number) => void;
  /** True while a pointing gesture is actively adjusting volume. */
  expanded: boolean;
  /** True during this control's turn in the gesture-demo rotation. */
  isDemoing?: boolean;
}

const DEMO_CYCLE_MS = 3000;

/**
 * Volume control. Always visible (bottom-right corner) — the
 * click/drag-accessible equivalent of the pointing-gesture volume
 * control. Real pointing input grows it and moves it toward the
 * vertical center of the screen (`expanded`).
 *
 * Styled as a plain dark/blurred "glass pill" div — matching
 * GestureLegend's mobile trigger and CameraStatusPanel — rather
 * than shadcn's `Card`. Card's own baked-in background/border/
 * theme classes would need overriding from the outside, which
 * risks losing to Card's own internal specificity; a plain div
 * styled the same way the other two overlay controls already are
 * sidesteps that entirely and keeps all three visually consistent
 * against the dark session background.
 *
 * Below the `md` breakpoint, the percentage text and slider track
 * collapse away, leaving only the speaker icon — full-size text
 * plus a 96px-tall drag track ate real space on narrow phone
 * screens for a control most sessions barely touch. Resting
 * position on mobile matches GestureLegend's "?" trigger exactly
 * (`bottom-6`), mirrored to the right side, so the two corner
 * controls read as a matched pair.
 *
 * Positioning is `bottom`-anchored throughout — collapsed *and*
 * expanded — rather than mixing `top` for one state and `bottom`
 * for the other, so the two states can transition smoothly instead
 * of jumping (the browser can't interpolate between two different
 * anchor properties). `bottom: 50%` + `translateY(50%)` achieves
 * the same vertical centering `top: 50%` + `translateY(-50%)`
 * would, just from the opposite edge.
 */
export function VolumeIndicator({
  volume,
  onVolumeChange,
  expanded,
  isDemoing = false,
}: VolumeIndicatorProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [demoDotPosition, setDemoDotPosition] = useState(0.5);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  useEffect(() => {
    if (!isDemoing) return;
    let rafId: number;
    const start = performance.now();

    const tick = (now: number) => {
      const t = ((now - start) % DEMO_CYCLE_MS) / DEMO_CYCLE_MS;
      const value = t < 0.5 ? t * 2 : 2 - t * 2;
      setDemoDotPosition(value);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [isDemoing]);

  const percent = Math.round(volume * 100);
  // On mobile, show the full widget only when something actually
  // calls for it; on md+ this doesn't matter since the "hidden
  // below md" classes below only apply under md anyway.
  const showFull = expanded || isDemoing || manuallyExpanded;

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const ratio = 1 - (clientY - rect.top) / rect.height;
      onVolumeChange(Math.max(0, Math.min(1, ratio)));
    },
    [onVolumeChange],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromClientY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag while a button/finger is actually down.
    if (e.buttons === 0) return;
    updateFromClientY(e.clientY);
  };

  return (
    <div
      className="fixed right-6 bottom-6 z-40 flex flex-col items-center gap-2 overflow-visible rounded-full border border-white/10 bg-black/40 p-1.5 md:p-3 text-white/80 backdrop-blur-sm transition-all duration-300 ease-out md:right-14 md:bottom-14"
      style={
        expanded
          ? { bottom: "50%", transform: "translateY(50%) scale(1.3)" }
          : { transform: "translateY(0) scale(1)" }
      }
    >
      <span
        className={cn(
          "text-md tabular-nums text-white/80",
          !showFull && "hidden md:inline",
        )}
      >
        {percent}%
      </span>
      <div className={cn("relative", !showFull && "hidden md:block")}>
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          role="slider"
          aria-label="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") onVolumeChange(Math.min(1, volume + 0.05));
            if (e.key === "ArrowDown")
              onVolumeChange(Math.max(0, volume - 0.05));
          }}
          className="relative h-24 w-3 shrink-0 cursor-pointer touch-none rounded-full bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
        >
          <div
            className="absolute bottom-0 w-full rounded-full bg-white transition-[height] duration-75"
            style={{ height: `${percent}%` }}
          />
        </div>
        {isDemoing && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-14 size-2.5 -translate-y-1/2 text-foreground"
            style={{ bottom: `${demoDotPosition * 100}%` }}
          >
            <Pointer className="size-6" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => setManuallyExpanded((v) => !v)}
        aria-label={
          showFull ? "Lautstärkeregler einklappen" : "Lautstärkeregler öffnen"
        }
        className="text-white/70 md:pointer-events-none md:cursor-default"
      >
        {percent === 0 ? <VolumeX /> : percent < 50 ? <Volume1 /> : <Volume2 />}
      </button>
    </div>
  );
}
