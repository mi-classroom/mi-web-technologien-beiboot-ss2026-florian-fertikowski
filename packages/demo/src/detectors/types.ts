/**
 * Defines the shared interface implemented by all detection modes
 * (Hands, Pose, Gesture). The UI can swap detector instances through
 * this interface without knowing their internal details.
 */

/**
 * Contract that every detection mode fulfils.
 * Lifecycle: init() -> detect()/draw() per frame -> dispose().
 */
export interface Detector {
  /** Display name of the mode */
  readonly name: string;

  /**
   * Loads WASM runtime and model from CDN.
   */
  init(): Promise<void>;

  /**
   * Runs inference on a single frame
   * Returns raw detection data, or null if not yet initialized.
   */
  detect(video: HTMLVideoElement, timestampMs: number): unknown;

  /**
   * Draws the detection result onto the given canvas
   */
  draw(ctx: CanvasRenderingContext2D, result: unknown): void;

  /**
   * Releases model resources. MUST be called, otherwise WASM
   * allocations leak
   */
  dispose(): void;
}

/** Identifier for the three available modes. */
export type ModeName = "hands" | "pose" | "gesture";
