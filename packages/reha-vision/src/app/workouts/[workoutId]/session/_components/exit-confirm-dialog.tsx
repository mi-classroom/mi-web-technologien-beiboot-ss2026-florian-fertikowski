"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExitConfirmDialogProps {
  open: boolean;
  /** Whether the fist is currently being held. */
  fistHeld: boolean;
  holdDurationMs: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Exit confirmation — reachable two ways, both landing in the same
 * dialog:
 *
 * 1. Gesture: hold a fist for `holdDurationMs`. While held, a
 *    countdown ring animates and auto-confirms on completion;
 *    releasing early cancels. Driven by the `fistHeld` prop, which
 *    mirrors the FistGesture detector's start/end events
 * 2. Click: the "X" and "End workout" buttons elsewhere in the
 *    session view open this same dialog with `fistHeld` false.
 */
export function ExitConfirmDialog({
  open,
  fistHeld,
  holdDurationMs,
  onConfirm,
  onCancel,
}: ExitConfirmDialogProps) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Tracks whether the fist-hold countdown is the thing currently
  // driving this dialog, as opposed to it having been opened by a
  // click with no gesture involved at all.
  const countdownActiveRef = useRef(false);

  useEffect(() => {
    if (!open) {
      countdownActiveRef.current = false;
      startRef.current = null;
      setProgress(0);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (!fistHeld) {
      if (countdownActiveRef.current) {
        // countdown via fist, released before completion
        countdownActiveRef.current = false;
        startRef.current = null;
        setProgress(0);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        onCancel();
      }
      // dialog opened by click, no countdown was ever running
      return;
    }

    // fistHeld is true: (re)start the countdown.
    countdownActiveRef.current = true;
    startRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - (startRef.current ?? 0);
      const p = Math.min(1, elapsed / holdDurationMs);
      setProgress(p);
      if (p >= 1) {
        countdownActiveRef.current = false;
        onConfirm();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, fistHeld, holdDurationMs]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <DialogTitle>End this workout?</DialogTitle>
          <DialogDescription>
            {fistHeld || progress > 0
              ? "Release your fist any time to keep going."
              : "Your progress on this exercise won't be saved."}
          </DialogDescription>
        </DialogHeader>

        {(fistHeld || progress > 0) && (
          <div className="flex items-center justify-center py-2">
            <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                className="stroke-muted"
                strokeWidth={6}
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                className="stroke-destructive"
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              />
            </svg>
          </div>
        )}

        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            End workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
