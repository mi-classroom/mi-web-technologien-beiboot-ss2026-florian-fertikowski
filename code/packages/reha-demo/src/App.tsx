import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { exercises } from "./data/exercises.ts";
import { OverviewScreen } from "./screens/overview-screen.tsx";
import { DetailScreen } from "./screens/detail-screen.tsx";
import { ActiveScreen } from "./screens/active-screen.tsx";
import { VideoPanel } from "./components/video-panel.tsx";
import { CursorOverlay } from "./components/cursor-overlay.tsx";
import { GestureHintBar } from "./components/gesture-hint-bar.tsx";
import { useWebcam } from "./hooks/use-webcam.ts";
import { useDetectionLoop } from "./hooks/use-detection-loop.ts";
import { useGestureRecognizer } from "./hooks/use-gesture-recognizer.ts";
import {
  PinchGesture,
  SwipeGesture,
  PauseGesture,
  PointingGesture,
} from "gesture-lib/gestures";

type Screen = "overview" | "detail" | "active";

const WEBCAM_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

function App() {
  const [screen, setScreen] = useState<Screen>("overview");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const highlightedIdRef = useRef<string | null>(null);

  useEffect(() => {
    highlightedIdRef.current = highlightedId;
  });

  const currentExercise = exercises[selectedIndex]!;

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

  const handleSelect = useCallback((id: string) => {
    const index = exercises.findIndex((e) => e.id === id);
    if (index >= 0) {
      setSelectedIndex(index);
      setScreen("detail");
    }
  }, []);

  const handleBack = useCallback(() => {
    setScreen("overview");
    setHighlightedId(null);
  }, []);

  const handlePrevious = useCallback(() => {
    setSelectedIndex(
      (i) => (i - 1 + exercises.length) % exercises.length,
    );
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((i) => (i + 1) % exercises.length);
  }, []);

  const handleStart = useCallback(() => {
    setSecondsLeft(currentExercise.durationSeconds);
    setPaused(false);
    setScreen("active");
  }, [currentExercise.durationSeconds]);

  const handleFinish = useCallback(() => {
    setScreen("detail");
    setPaused(false);
  }, []);

  const handleTogglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  useEffect(() => {
    if (screen !== "active" || paused) return;
    if (secondsLeft <= 0) {
      setScreen("detail");
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [screen, paused, secondsLeft]);

  const { videoRef, ready, error } = useWebcam(WEBCAM_CONSTRAINTS);

  const gestures = useMemo(
    () => [
      new PinchGesture(),
      new SwipeGesture(),
      new PauseGesture({
        activateExtendedThreshold: 0.6,
        releaseExtendedThreshold: 0.45,
        thumbAbductionThreshold: 0.35,
      }),
      new PointingGesture(),
    ],
    [],
  );

  const { processFrame, pointingPosition } = useGestureRecognizer<Screen>({
    gestures,
    activeContext: screen,
    handlers: {
      "pinch-end": {
        contexts: ["overview", "detail", "active"],
        handler: () => {
          if (screen === "overview") {
            const id = highlightedIdRef.current;
            if (id) handleSelect(id);
          } else if (screen === "detail") {
            handleStart();
          } else if (screen === "active") {
            handleTogglePause();
            showFeedback(paused ? "RESUME" : "PAUSE (pinch)", true);
          }
        },
      },
      "pinch-start": {
        contexts: ["overview", "detail", "active"],
        handler: () => showFeedback("PINCH", false),
      },
      "swipe-left": {
        contexts: ["detail", "active"],
        handler: () => {
          if (screen === "detail") {
            handleNext();
            showFeedback("→ NEXT", true);
          } else if (screen === "active") {
            handleFinish();
            showFeedback("ABORT", true);
          }
        },
      },
      "swipe-right": {
        contexts: ["detail", "active"],
        handler: () => {
          if (screen === "detail") {
            handlePrevious();
            showFeedback("← PREVIOUS", true);
          } else if (screen === "active") {
            handleFinish();
            showFeedback("ABORT", true);
          }
        },
      },
      "pause-start": {
        contexts: ["active"],
        handler: () => {
          setPaused(true);
          showFeedback("PAUSE (palm)", false);
        },
      },
      "pause-end": {
        contexts: ["active"],
        handler: () => {
          setPaused(false);
          showFeedback("RESUME", true);
        },
      },
      "pointing-move": {
        contexts: ["overview"],
        handler: (event) => {
          const viewportX = (1 - event.x) * window.innerWidth;
          const viewportY = event.y * window.innerHeight;

          const el = document.elementFromPoint(viewportX, viewportY);
          const card = el?.closest("[data-exercise-id]");
          const id = card?.getAttribute("data-exercise-id") ?? null;
          setHighlightedId(id);
        },
      },
      "pointing-start": {
        contexts: ["overview"],
        handler: () => showFeedback("POINTING", false),
      },
      "pointing-end": {
        contexts: ["overview"],
        handler: () => {
          showFeedback("", true);
        },
      },
    },
  });

  useDetectionLoop({
    videoRef,
    active: ready,
    onResult: processFrame,
  });

  // Convert library's normalized coords to viewport coords for the
  // cursor overlay. Same x-flip as inside the pointing-move handler.
  const viewportCursor = useMemo(() => {
    if (!pointingPosition) return null;
    return { x: 1 - pointingPosition.x, y: pointingPosition.y };
  }, [pointingPosition]);

  const hints = useMemo(() => {
    switch (screen) {
      case "overview":
        return [
          {
            text: "point to select",
            iconName: "point"
          },
          {
            text: "pinch to open",
            iconName: "pinch"
          }
        ];
      case "detail":
        return [
          {
            text: "swipe to browse",
            iconName: "swipe"
          },
          {
            text: "pinch to start",
            iconName: "pinch"
          }
        ]
      case "active":
        return [
          {
            text: "open palm to pause",
            iconName: "palm"
          },
          {
            text: "swipe to end",
            iconName: "swipe"
          }
        ]
    }
  }, [screen]);

  const statusText = error
    ? `Camera error: ${error}`
    : !ready
      ? "Requesting camera..."
      : undefined;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <GestureHintBar hints={hints} />

      {screen === "overview" && (
        <OverviewScreen
          exercises={exercises}
          highlightedId={highlightedId}
          onSelect={handleSelect}
        />
      )}

      {screen === "detail" && (
        <DetailScreen
          exercise={currentExercise}
          positionLabel={`${selectedIndex + 1} of ${exercises.length}`}
          onBack={handleBack}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onStart={handleStart}
        />
      )}

      {screen === "active" && (
        <ActiveScreen
          exercise={currentExercise}
          secondsLeft={secondsLeft}
          paused={paused}
          onFinish={handleFinish}
        />
      )}

      <CursorOverlay position={viewportCursor} />
      <VideoPanel
        videoRef={videoRef}
        message={feedbackMessage}
        statusText={statusText}
      />
    </div>
  );
}

export default App;
