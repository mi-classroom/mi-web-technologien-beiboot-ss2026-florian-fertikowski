/**
 * Public entry point of the `detectors/` module. Other parts of the
 * app import only from here, never directly from the
 * individual files.
 */

import type { Detector, ModeName } from "./types.ts";
import { PoseDetector } from "./pose-recognition.ts";
import { GestureDetector } from "./gesture-recognition.ts";
import { HandsDetector } from "./hand-recognition.ts";

/**
 * Factory: creates a fresh detector instance for the given mode
 */
export function createDetector(mode: ModeName): Detector {
  switch (mode) {
    case "hands":
      return new HandsDetector();
    case "pose":
      return new PoseDetector();
    case "gesture":
      return new GestureDetector();
  }
}

export type { Detector, ModeName };
