import { FilesetResolver } from "@mediapipe/tasks-vision";

export const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

/**
 * MediaPipe's convention for connecting the 21 hand landmarks.
 * Needed by both HandLandmarker and GestureRecognizer
 */
export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  // thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // middle
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // ring
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // pinky
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // palm base
  [0, 17],
];

/**
 * Selected pose connections for visualization. Limited to a stick-figure skeleton (torso,
 * arms, legs) for demo purposes
 */
export const POSE_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  [27, 29],
  [27, 31],
  // Right leg
  [24, 26],
  [26, 28],
  [28, 30],
  [28, 32],
];

/**
 * Loads the FilesetResolver that supplies the WASM runtime for all
 * vision tasks.
 */
export function loadVisionFileset(): ReturnType<
  typeof FilesetResolver.forVisionTasks
> {
  return FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
}

/**
 * Narrow type shared by MediaPipe's landmark objects
 */
export interface NormalizedPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
  presence?: number;
}

/**
 * Drawing helper that draws skeleton connections (hand or pose) as lines onto the canvas.
 * (Missing points are skipped so partial detections do not crash)
 */
export function drawConnections(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<NormalizedPoint>,
  connections: ReadonlyArray<readonly [number, number]>,
  style: { color: string; lineWidth: number } = {
    color: "#5eead4",
    lineWidth: 2,
  },
): void {
  const { width, height } = ctx.canvas;
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.lineWidth;
  ctx.beginPath();
  for (const [a, b] of connections) {
    const p1 = points[a];
    const p2 = points[b];
    if (!p1 || !p2) continue;
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
  }
  ctx.stroke();
}

/**
 * Drawing helper that draws the landmark points themselves as filled circles
 */
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<NormalizedPoint>,
  style: { color: string; radius: number } = {
    color: "#fef08a",
    radius: 4,
  },
): void {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = style.color;
  for (const p of points) {
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, style.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Drawing helper that draws a text label above a point
 * (used e.g. to put a gesture name next to a hand)
 */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  anchor: NormalizedPoint,
  text: string,
  offsetY = 20,
): void {
  const { width, height } = ctx.canvas;
  const x = anchor.x * width;
  const y = anchor.y * height;

  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);

  ctx.font = "14px ui-monospace, monospace";
  const padding = 12;
  const labelWidth = ctx.measureText(text).width + padding;
  const labelHeight = 22;

  // Background box
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(
    width - x - labelWidth / 2,
    y + offsetY,
    labelWidth,
    labelHeight,
  );

  // Text
  ctx.fillStyle = "#5eead4";
  ctx.fillText(
    text,
    width - x - labelWidth / 2 + padding / 2,
    y + offsetY + 15,
  );
  ctx.restore();
}
