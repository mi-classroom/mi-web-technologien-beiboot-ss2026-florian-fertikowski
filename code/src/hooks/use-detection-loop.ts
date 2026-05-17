/**
 * manages the requestAnimationFrame loop that calls a detector per frame,
 * draws the result onto the canvas, and forwards performance stats to the caller.
 *
 * Two design decisions that are non-obvious in a React real-time
 * setup and worth explaining in a code review:
 *
 */

import { useEffect, useRef } from "react";
import { createDetector, type ModeName } from "../detectors";

/** Per-frame stats computed by the loop and pushed to the UI. */
interface FrameStats {
  fps: number;
  inferenceMs: number;
  detectionCount: number;
  resultJson: string;
}

interface UseDetectionLoopOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  mode: ModeName;
  active: boolean;
  /**
   * Called once per frame with the current stats.
   * The caller is expected to write directly into the
   * DOM to avoid triggering React re-renders (no useState).
   */
  onFrame: (stats: FrameStats) => void;
  /** Optional: status messages. */
  onStatusChange?: (status: string) => void;
}

export function useDetectionLoop({
  videoRef,
  canvasRef,
  mode,
  active,
  onFrame,
  onStatusChange,
}: UseDetectionLoopOptions): void {
  // Refs mirror the props so the detection effect does not restart
  // when they change. Initialized with the first render values and
  // updated in the effect below.
  const onFrameRef = useRef(onFrame);
  const onStatusChangeRef = useRef(onStatusChange);

  // Sync refs after every render
  useEffect(() => {
    onFrameRef.current = onFrame;
    onStatusChangeRef.current = onStatusChange;
  });

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let rafId = 0;
    let lastFrameTs = performance.now();
    // EMA (exponential moving average) for the FPS readout. Raw FPS
    // fluctuates too much to read
    let fpsEMA = 0;

    const detector = createDetector(mode);

    (async () => {
      onStatusChangeRef.current?.(`Loading ${mode}...`);
      try {
        await detector.init();
      } catch (err) {
        onStatusChangeRef.current?.(`Error: ${(err as Error).message}`);
        return;
      }
      // If the effect was already cleaned up during async init release the detector again.
      if (cancelled) {
        detector.dispose();
        return;
      }
      onStatusChangeRef.current?.(`${mode} active`);

      /**
       * Inner loop function. rAF-recursive: schedules itself at the
       * top so we keep running even if the body early-returns this
       * frame.
       */
      const tick = () => {
        rafId = requestAnimationFrame(tick);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState < 2) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (
          canvas.width !== video.videoWidth ||
          canvas.height !== video.videoHeight
        ) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // FPS measurement
        const now = performance.now();
        const delta = now - lastFrameTs;
        lastFrameTs = now;
        fpsEMA =
          fpsEMA === 0 ? 1000 / delta : fpsEMA * 0.9 + (1000 / delta) * 0.1;

        // Measure inference time in isolation
        const t0 = performance.now();
        const result = detector.detect(video, now);
        const t1 = performance.now();

        // Clear canvas every frame, otherwise overlays accumulate.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        detector.draw(ctx, result);

        onFrameRef.current({
          fps: fpsEMA,
          inferenceMs: t1 - t0,
          detectionCount: countDetections(result),
          resultJson: stringifyResult(result),
        });
      };

      tick();
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      // dispose() to release WASM allocations, otherwise
      // they leak on every mode switch.
      detector.dispose();
    };
  }, [mode, active, videoRef, canvasRef]);
}

/**
 * Counts detected entities (hands or poses) in a detection result.
 */
function countDetections(result: unknown): number {
  if (!result || typeof result !== "object") return 0;
  const r = result as { landmarks?: unknown[] };
  return r.landmarks?.length ?? 0;
}

/**
 * Compact JSON view of the result for the debug panel. The full
 * landmark lists would flood the panel
 * -> truncate arrays after 3 items
 */
function stringifyResult(result: unknown): string {
  if (!result) return "null";
  try {
    const r = result as Record<string, unknown>;
    const summary: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) {
      if (Array.isArray(v)) {
        summary[k] = v.map((item) =>
          Array.isArray(item) ? [...item.slice(0, 3), "..."] : item,
        );
      } else {
        summary[k] = v;
      }
    }
    return JSON.stringify(summary, null, 2);
  } catch {
    return String(result);
  }
}
