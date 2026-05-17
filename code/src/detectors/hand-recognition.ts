/**
 * Hand landmark detection via MediaPipe `HandLandmarker`.
 * Model-Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 * Emits 21 points with normalized coordinates per detected hand
 */

import {
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";
import type { Detector } from "./types";
import {
  HAND_CONNECTIONS,
  drawConnections,
  drawLandmarks,
  loadVisionFileset,
} from "./utils";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export class HandsDetector implements Detector {
  readonly name = "hands";

  private landmarker: HandLandmarker | null = null;

  /**
   * Loads WASM runtime and model
   */
  async init(): Promise<void> {
    const fileset = await loadVisionFileset();
    this.landmarker = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }

  /**
   * Inference for one frame
   */
  detect(
    video: HTMLVideoElement,
    timestampMs: number,
  ): HandLandmarkerResult | null {
    if (!this.landmarker) return null;
    return this.landmarker.detectForVideo(video, timestampMs);
  }

  /**
   * Draws all detected hands onto the canvas.
   * One hand = connection lines (skeleton) + 21 landmark dots.
   */
  draw(ctx: CanvasRenderingContext2D, result: unknown): void {
    const r = result as HandLandmarkerResult | null;
    if (!r?.landmarks) return;

    for (const hand of r.landmarks) {
      drawConnections(ctx, hand, HAND_CONNECTIONS);
      drawLandmarks(ctx, hand);
    }
  }

  /**
   * Frees WASM allocations. Required before garbage collection,
   * otherwise WASM modules retain memory indefinitely.
   */
  dispose(): void {
    this.landmarker?.close();
    this.landmarker = null;
  }
}
