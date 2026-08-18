/**
 * Named indices into the 21-point hand landmark array used by
 * MediaPipe's HandLandmarker (and compatible models)
 *
 * These were previously duplicated as private constants inside
 * each built-in gesture (pinch.ts, swipe.ts, finger-postures.ts).
 * Exporting them publicly means a consumer writing a custom
 * gesture detector (see the "Writing a custom gesture" section of
 * the README) doesn't have to rediscover or copy them from the
 * library's internals.
 *
 * Reference: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker
 */
export const HAND_LANDMARKS = {
  WRIST: 0,

  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,

  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,

  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,

  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,

  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

/**
 * Union of all valid landmark-index values. Mostly useful for
 * functions that accept "any landmark index" generically.
 */
export type HandLandmarkIndex =
  (typeof HAND_LANDMARKS)[keyof typeof HAND_LANDMARKS];

/**
 * The four non-thumb fingers, grouped with their MCP/PIP/TIP
 * indices. Convenient for writing extended/curled checks for a
 * specific finger without hand-picking three constants each time.
 *
 *   const { mcp, tip } = FINGER_LANDMARKS.index;
 */
export const FINGER_LANDMARKS = {
  index: {
    mcp: HAND_LANDMARKS.INDEX_MCP,
    pip: HAND_LANDMARKS.INDEX_PIP,
    dip: HAND_LANDMARKS.INDEX_DIP,
    tip: HAND_LANDMARKS.INDEX_TIP,
  },
  middle: {
    mcp: HAND_LANDMARKS.MIDDLE_MCP,
    pip: HAND_LANDMARKS.MIDDLE_PIP,
    dip: HAND_LANDMARKS.MIDDLE_DIP,
    tip: HAND_LANDMARKS.MIDDLE_TIP,
  },
  ring: {
    mcp: HAND_LANDMARKS.RING_MCP,
    pip: HAND_LANDMARKS.RING_PIP,
    dip: HAND_LANDMARKS.RING_DIP,
    tip: HAND_LANDMARKS.RING_TIP,
  },
  pinky: {
    mcp: HAND_LANDMARKS.PINKY_MCP,
    pip: HAND_LANDMARKS.PINKY_PIP,
    dip: HAND_LANDMARKS.PINKY_DIP,
    tip: HAND_LANDMARKS.PINKY_TIP,
  },
} as const;

export type FingerName = keyof typeof FINGER_LANDMARKS;
