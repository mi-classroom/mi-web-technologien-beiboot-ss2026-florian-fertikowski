"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
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
 * Volume control. Always visible (bottom-right corner, small) —
 * this is the click/drag-accessible equivalent of the pointing-gesture volume control.
 * Real pointing input grows it and moves it next to the video (`expanded`)
 */
export function VolumeIndicator({
  volume,
  onVolumeChange,
  expanded,
  isDemoing = false,
}: VolumeIndicatorProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [demoDotPosition, setDemoDotPosition] = useState(0.5);

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
    <Card
      className="fixed right-14 z-40 flex flex-col items-center gap-2 p-3 transition-[top,transform] duration-300 ease-out overflow-visible"
      style={{
        top: expanded ? "50%" : "calc(100% - 9rem)",
        transform: expanded
          ? "translateY(-50%) scale(1.3)"
          : "translateY(-50%) scale(1)",
      }}
    >
      <span className="text-md tabular-nums text-foreground/80">
        {percent}%
      </span>
      <div className="relative">
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
          className="relative h-24 w-3 shrink-0 cursor-pointer touch-none rounded-full bg-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
        >
          <div
            className={cn(
              "absolute bottom-0 w-full rounded-full bg-primary transition-[height] duration-75",
            )}
            style={{ height: `${percent}%` }}
          />
        </div>
        {isDemoing && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-14 size-2.5 -translate-y-1/2"
            style={{ bottom: `${demoDotPosition * 100}%` }}
          >
            <Pointer className="size-6" />
          </div>
        )}
      </div>
      <span aria-hidden="true">
        {percent === 0 ? <VolumeX /> : percent < 50 ? <Volume1 /> : <Volume2 />}
      </span>
    </Card>
  );
}
