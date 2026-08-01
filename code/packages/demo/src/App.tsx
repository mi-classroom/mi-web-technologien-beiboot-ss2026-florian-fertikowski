import { useCallback, useMemo, useRef, useState } from "react";
import type { ModeName } from "./detectors";
import { useWebcam } from "./hooks/use-webcam.ts";
import { useDetectionLoop } from "./hooks/use-detection-loop.ts";
import {
  DebugPanel,
  type DebugPanelHandle,
} from "./components/debug-panel.tsx";
import { VideoStage } from "./components/video-stage.tsx";
import { ModeSwitcher } from "./components/mode-switcher.tsx";
import { useGestureRecognizer } from "./hooks/use-gesture-recognizer.ts";
import { PinchIndicator } from "./components/pinch-indicator.tsx";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { GestureFeedback } from "./components/gesture-feedback.tsx";
import {
  PinchGesture,
  SwipeGesture,
  PauseGesture,
  PointingGesture,
} from "gesture-lib/gestures";
import { PointingCursor } from "./components/pointing-cursor.tsx";

/**
 * Desired webcam configuration. Using `ideal` gives the camera room
 * to pick the closest supported value if the exact values aren't
 * available.
 */
const WEBCAM_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

function App() {
  const [mode, setMode] = useState<ModeName>("hands");
  const [status, setStatus] = useState("Initializing...");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const feedbackTimeoutRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugPanelRef = useRef<DebugPanelHandle>(null);

  const { videoRef, ready, error, resolution } = useWebcam(WEBCAM_CONSTRAINTS);

  const showFeedback = useCallback((message: string, autoHide: boolean) => {
    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }

    setFeedbackMessage(message);

    if (autoHide) {
      feedbackTimeoutRef.current = window.setTimeout(() => {
        setFeedbackMessage(null);
        feedbackTimeoutRef.current = null;
      }, 1500);
    }
  }, []);

  // Construct the gesture instances once. useMemo with an empty
  // dependency array keeps the array identity stable across renders,
  // so the recognizer hook doesn't see "new gestures" every time.
  const gestures = useMemo(
    () => [
      new PinchGesture(),
      new SwipeGesture(),
      new PauseGesture(),
      new PointingGesture(),
    ],
    [],
  );

  const { processFrame, pinchState, pointingPosition } = useGestureRecognizer({
    gestures,
    handlers: {
      "pinch-start": () => {
        // Toast stays visible while pinch is held (autoHide=false).
        showFeedback("PINCH", false);
      },
      "pinch-end": (event) => {
        const seconds = (event.durationMs / 1000).toFixed(1);
        showFeedback(`PINCH (${seconds}s)`, true);
      },
      // Detector reports raw direction in MediaPipe coordinates. The
      // video is CSS-mirrored, so we flip the label so the user sees
      // their perceived direction. See gesture-observations.md.
      "swipe-left": () => showFeedback("SWIPE RIGHT >", true),
      "swipe-right": () => showFeedback("< SWIPE LEFT", true),
      "pause-start": () => {
        // Toast stays visible while the palm is held (autoHide=false).
        showFeedback("PAUSE", false);
      },
      "pause-end": (event) => {
        const seconds = (event.durationMs / 1000).toFixed(1);
        showFeedback(`PAUSE (${seconds}s)`, true);
      },
      "pointing-start": () => {
        // Stays visible while pointing is active.
        showFeedback("POINTING", false);
      },
      "pointing-end": (event) => {
        const seconds = (event.durationMs / 1000).toFixed(1);
        showFeedback(`POINTING (${seconds}s)`, true);
      },
    },
  });

  const handleResult = useCallback(
    (result: unknown, timestamp: number) => {
      // Hand-based gestures only run in the hands mode. Gesture
      // mode also has hand landmarks, but in the spike we keep the
      // modes cleanly separated so it's obvious what triggers what.
      if (mode === "hands") {
        processFrame(result as HandLandmarkerResult | null, timestamp);
      }
    },
    [mode, processFrame],
  );

  useDetectionLoop({
    videoRef,
    canvasRef,
    mode,
    active: ready,
    onFrame: (stats) => debugPanelRef.current?.update(stats),
    onResult: handleResult,
    onStatusChange: setStatus,
  });

  const displayStatus = error
    ? `Error: ${error}`
    : !ready
      ? "Requesting camera..."
      : status;

  return (
    <div className="flex min-h-screen flex-col">
      <main className="grid flex-1 gap-4 p-6 lg:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-3">
          <div className={"relative"}>
            <VideoStage
              videoRef={videoRef}
              ref={canvasRef}
              status={displayStatus}
            />
            <GestureFeedback message={feedbackMessage} />
            <PinchIndicator state={pinchState} />
            <PointingCursor position={pointingPosition} />
          </div>
          <ModeSwitcher mode={mode} onModeChange={setMode} />
        </section>
        <DebugPanel ref={debugPanelRef} resolution={resolution} />
      </main>
    </div>
  );
}

export default App;
