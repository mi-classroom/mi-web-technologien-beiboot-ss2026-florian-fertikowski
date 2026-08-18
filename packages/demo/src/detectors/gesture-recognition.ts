/**
 *  Hand gesture recognition via MediaPipe 'GestureRecognizer'
 *  Model-Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/gesture_recognizer
 *  Emits the same hand landmarks as HandLandmarker, but also gives a
 *  classification into one of 7 pretrained gestures:
 *   None, Closed_Fist, Open_Palm, Pointing_Up, Thumb_Down,
 *   Thumb_Up, Victory, ILoveYou.
 */

import {
  GestureRecognizer,
  type GestureRecognizerResult,
} from "@mediapipe/tasks-vision";
import type { Detector } from "./types.ts";
import {
  HAND_CONNECTIONS,
  drawConnections,
  drawLabel,
  drawLandmarks,
  loadVisionFileset,
} from "./utils.ts";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

export class GestureDetector implements Detector {
  readonly name = "gesture";
  private recognizer: GestureRecognizer | null = null;

  async init(): Promise<void> {
    const fileset = await loadVisionFileset();
    this.recognizer = await GestureRecognizer.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }

  detect(
    video: HTMLVideoElement,
    timestampMs: number,
  ): GestureRecognizerResult | null {
    if (!this.recognizer) return null;
    return this.recognizer.recognizeForVideo(video, timestampMs);
  }

  draw(ctx: CanvasRenderingContext2D, result: unknown): void {
    const r = result as GestureRecognizerResult | null;
    if (!r?.landmarks) return;

    r.landmarks.forEach((hand, i) => {
      drawConnections(ctx, hand, HAND_CONNECTIONS);
      drawLandmarks(ctx, hand, { color: "#fef08a", radius: 3 });

      // Render the recognized gesture as a label above the wrist
      const wrist = hand[0];
      const gesture = r.gestures?.[i]?.[0];
      if (wrist && gesture) {
        const label = `${gesture.categoryName} ${(gesture.score * 100).toFixed(0)}%`;
        drawLabel(ctx, wrist, label);
      }
    });
  }

  dispose(): void {
    this.recognizer?.close();
    this.recognizer = null;
  }
}
