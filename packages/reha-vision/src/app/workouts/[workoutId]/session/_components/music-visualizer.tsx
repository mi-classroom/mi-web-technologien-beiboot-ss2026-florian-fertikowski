"use client";

import { useEffect, useRef } from "react";

interface MusicVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** Only animates while true; otherwise the canvas stays empty. */
  active: boolean;
}

const BAR_COUNT = 48;

// Module-level (not per-component-instance) so it survives across
// Strict Mode's remount of the component on the same DOM element.
const analyserByElement = new WeakMap<HTMLMediaElement, AnalyserNode>();
const contextByElement = new WeakMap<HTMLMediaElement, AudioContext>();

/**
 * Audio-reactive bar visualizer across the bottom of the screen —
 * the classic up/down frequency bars. Uses the Web Audio API's
 * AnalyserNode on the session's <audio> element.
 */
export function MusicVisualizer({ audioRef, active }: MusicVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let audioCtx: AudioContext | null = null;
    let resumeListenerAdded = false;
    const resume = () => {
      audioCtx?.resume().catch(() => {});
    };

    const existingAnalyser = analyserByElement.get(audio);
    if (existingAnalyser) {
      // A prior mount (this one, or a Strict-Mode phantom before
      // it) already connected this exact element successfully -> Reuse it
      analyserRef.current = existingAnalyser;
      audioCtx = contextByElement.get(audio) ?? null;
      resume();
      if (audioCtx) {
        document.addEventListener("pointerdown", resume, { once: true });
        resumeListenerAdded = true;
      }
    } else {
      try {
        audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(audio);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyserRef.current = analyser;
        analyserByElement.set(audio, analyser);
        contextByElement.set(audio, audioCtx);

        resume();
        document.addEventListener("pointerdown", resume, { once: true });
        resumeListenerAdded = true;
      } catch (err) {
        // Only reachable for a new element that still fails, e.g. CORS-related restrictions
        // -> Fail silently since decorative feature; the session still works without the visual
        console.warn("Music visualizer unavailable:", err);
      }
    }

    return () => {
      if (resumeListenerAdded) {
        document.removeEventListener("pointerdown", resume);
      }
      analyserRef.current = null;
    };
  }, [audioRef]);

  // Drawing loop, separate from setup so toggling `active` doesn't
  // touch the connection above at all.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const draw = () => {
      const analyser = analyserRef.current;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      if (analyser && active) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const barWidth = width / BAR_COUNT;
        for (let i = 0; i < BAR_COUNT; i++) {
          const value = data[Math.floor((i / BAR_COUNT) * data.length)] ?? 0;
          const barHeight = (value / 255) * height;
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.fillRect(
            i * barWidth + 1,
            height - barHeight,
            barWidth - 2,
            barHeight,
          );
        }
      }

      rafId = requestAnimationFrame(draw);
    };
    rafId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafId);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={64}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-8 left-1/2 h-16 w-[min(90%,36rem)] -translate-x-1/2 opacity-70"
    />
  );
}
