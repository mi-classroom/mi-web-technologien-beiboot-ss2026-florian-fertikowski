/**
 * Pose recognition via MediaPipe 'PoseLandmarker' (Lite variant)
 * Model-Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 *
 * Emits 33 landmarks (face, shoulders, arms, hips, legs, feet) with normalized coordinates.
 */

import {
  PoseLandmarker,
  type PoseLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { Detector } from "./types.ts";
import {
  drawConnections,
  drawLandmarks,
  loadVisionFileset,
  POSE_CONNECTIONS,
} from "./utils.ts";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export class PoseDetector implements Detector {
  readonly name = "pose";
  private landmarker: PoseLandmarker | null = null;

  async init(): Promise<void> {
    const fileset = await loadVisionFileset();
    this.landmarker = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
    });
  }

  detect(
    video: HTMLVideoElement,
    timestampMs: number,
  ): PoseLandmarkerResult | null {
    if (!this.landmarker) return null;
    return this.landmarker.detectForVideo(video, timestampMs);
  }

  draw(ctx: CanvasRenderingContext2D, result: unknown): void {
    const r = result as PoseLandmarkerResult | null;
    if (!r?.landmarks) return;

    for (const pose of r.landmarks) {
      drawConnections(ctx, pose, POSE_CONNECTIONS, {
        color: "#5eead4",
        lineWidth: 3,
      });
      drawLandmarks(ctx, pose);
    }
  }

  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
