/**
 * Runs the MediaPipe HandLandmarker in a per-frame loop over the
 * webcam video element and calls onResult on every frame.
 *
 * Owns the model lifecycle (load on mount, close on unmount).
 * The caller only supplies the video ref and a callback.
 */

import { useEffect, useRef } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

interface DetectionLoopOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
  onResult: (result: HandLandmarkerResult, timestamp: number) => void;
}

export function useDetectionLoop({
  videoRef,
  active,
  onResult,
}: DetectionLoopOptions): void {
  // Latest onResult in a ref so the loop keeps calling the current
  // function even as it re-renders.
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (!active) return;
    let landmarker: HandLandmarker | null = null;
    let rafId: number | null = null;
    let cancelled = false;
    let lastVideoTime = -1;

    (async () => {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      if (cancelled) return;

      landmarker = await HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      if (cancelled) {
        landmarker.close();
        return;
      }

      const tick = () => {
        if (cancelled || !landmarker) return;
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          const now = performance.now();
          const result = landmarker.detectForVideo(video, now);
          onResultRef.current(result, now);
        }
        rafId = requestAnimationFrame(tick);
      };
      tick();
    })();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (landmarker) landmarker.close();
    };
  }, [active, videoRef]);
}
