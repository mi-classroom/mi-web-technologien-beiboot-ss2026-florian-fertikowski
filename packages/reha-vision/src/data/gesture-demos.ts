/**
 * Short demo clips showing the actual hand gesture for each
 * control, periodically swapped in over the control's normal icon
 *
 * Volume has no entry here on purpose: no suitable stock footage
 * exists for "pointing controls a volume slider" specifically, so
 * its demo is a small self-contained animation instead (see
 * volume-indicator.tsx) rather than a video.
 */

import { VIDEO_BASE_URL } from "./exercises";

export const gestureDemoVideos = {
  pinch: `${VIDEO_BASE_URL}/gestures/pinch.webm`,
  swipeLeft: `${VIDEO_BASE_URL}/gestures/swipe-left.webm`,
  swipeRight: `${VIDEO_BASE_URL}/gestures/swipe-right.webm`,
  fist: `${VIDEO_BASE_URL}/gestures/fist.webm`,
} as const;
