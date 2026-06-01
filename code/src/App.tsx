import { useCallback, useRef, useState } from "react";
import type { ModeName } from "./detectors";
import { useWebcam } from "./hooks/use-webcam.ts";
import { useDetectionLoop } from "./hooks/use-detection-loop.ts";
import {
  DebugPanel,
  type DebugPanelHandle,
} from "./components/debug-panel.tsx";
import { VideoStage } from "./components/video-stage.tsx";
import { ModeSwitcher } from "./components/mode-switcher.tsx";
import { usePinchGesture } from "./hooks/use-pinch-gesture";
import { useSwipeGesture } from "./hooks/use-swipe-gesture";
import { PinchIndicator } from "./components/pinch-indicator";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debugPanelRef = useRef<DebugPanelHandle>(null);

  const { videoRef, ready, error, resolution } = useWebcam(WEBCAM_CONSTRAINTS);
  const { processFrame: processPinchFrame, state: pinchState } =
    usePinchGesture({
      onEvent: (event) => {
        console.log("Pinch event:", event);
      },
    });

  const { processFrame: processSwipeFrame } = useSwipeGesture({
    onEvent: (event) => {
      console.log("Swipe event:", event);
    },
  });

  const handleResult = useCallback(
    (result: unknown, timestamp: number) => {
      // Hand-based gestures only run in the hands mode. Gesture
      // mode also has hand landmarks, but in the spike we keep the
      // modes cleanly separated so it's obvious what triggers what.
      if (mode === "hands") {
        const r = result as HandLandmarkerResult | null;
        processPinchFrame(r, timestamp);
        processSwipeFrame(r, timestamp);
      }
    },
    [mode, processPinchFrame, processSwipeFrame],
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
            <PinchIndicator state={pinchState} />
          </div>
          <ModeSwitcher mode={mode} onModeChange={setMode} />
        </section>
        <DebugPanel ref={debugPanelRef} resolution={resolution} />
      </main>
    </div>
  );
}

export default App;
