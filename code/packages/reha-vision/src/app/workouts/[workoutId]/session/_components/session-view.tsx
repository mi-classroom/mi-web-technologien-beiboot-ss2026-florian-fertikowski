"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import { X } from "lucide-react";
import {
  PinchGesture,
  SwipeGesture,
  PauseGesture,
  PointingGesture,
} from "gesture-lib/gestures";

import { useWebcam } from "@/hooks/use-webcam";
import { useDetectionLoop } from "@/hooks/use-detection-loop";
import { useGestureRecognizer } from "@/hooks/use-gesture-recognizer";
import { FistGesture } from "@/lib/gestures/fist";
import { exercises as allExercises } from "@/data/exercises";
import { MUSIC_TRACK_URL } from "@/data/audio";
import { gestureDemoVideos } from "@/data/gesture-demos";
import { CornerFrame } from "@/app/workouts/[workoutId]/session/_components/corner-frame";
import { CameraStatusPanel } from "@/app/workouts/[workoutId]/session/_components/camera-status-panel";
import { NavArrowButton } from "@/app/workouts/[workoutId]/session/_components/nav-arrow-button";
import { ExerciseMedia } from "@/app/workouts/[workoutId]/session/_components/exercise-media";
import { SessionControlButton } from "@/app/workouts/[workoutId]/session/_components/session-control-button";
import { EndWorkoutButton } from "@/app/workouts/[workoutId]/session/_components/end-workout-button";
import { MusicVisualizer } from "@/app/workouts/[workoutId]/session/_components/music-visualizer";
import { GestureLegend } from "@/app/workouts/[workoutId]/session/_components/gesture-legend";
import { VolumeIndicator } from "@/app/workouts/[workoutId]/session/_components/volume-indicator";
import { ExitConfirmDialog } from "@/app/workouts/[workoutId]/session/_components/exit-confirm-dialog";
import { Button } from "@/components/ui/button";

const WEBCAM_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: false,
};

const FIST_HOLD_MS = 5000;

/**
 * Gesture-demo rotation: each control gets a turn showing its
 * actual gesture (video, or for volume, a self-contained fake
 * animation) instead of its normal icon, one at a time rather than
 * all at once — a guided tour instead of five things flashing
 * simultaneously.
 *
 * Two conditions gate the rotation:
 *
 * - DEMO_INITIAL_DELAY_MS: the rotation doesn't start immediately
 *   on mount. A first-time visitor needs a moment to just look at
 *   the screen
 * - Mouse activity: the rotation pauses entirely while the mouse
 *   has moved within MOUSE_IDLE_MS. Someone moving their mouse is
 *   presumably already exploring the UI themselves; a demo
 *   competing for attention at that moment is more annoying than
 *   helpful. It resumes once the mouse has been still for that long.
 */
type DemoTarget = "control" | "left" | "right" | "volume" | "exit";
const DEMO_ROTATION: DemoTarget[] = [
  "control",
  "left",
  "right",
  "volume",
  "exit",
];
const DEMO_SLOT_MS = 4000;
const DEMO_INITIAL_DELAY_MS = 6000;
const MOUSE_IDLE_MS = 3000;

const slideVariants = {
  enter: (direction: 1 | -1) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 1 | -1) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
  }),
};

type SessionScreen = "detail" | "active";
type SessionContext = SessionScreen | "exit-confirm";

interface SessionViewProps {
  workoutId: string;
}

/**
 * Big Picture Mode session. Split out from the route's page.tsx so the page itself
 * can stay a server component exporting generateStaticParams() (required for static
 * export — see next.config.ts).
 *
 * `workoutId` comes in as a prop instead of via useParams(),
 * since useParams() needs the Client Component boundary to already be inside a client tree
 * that isn't also trying to export server-only functions.
 *
 *    pinch                  start session
 *    open palm              (running -> pauses)
 *                           (paused -> resumes)
 *    swipe left/right       navigate forward/backward in the exercise list
 *    fist-hold (5s)         exit session
 *    pointing      volume adjustment
 *
 *    Each control periodically demonstrates its actual gesture
 *
 * Screen state within a session:
 * - "detail": showing the current exercise, not yet timing.
 * - "active": timer running for the current exercise.
 *
 */
export function SessionView({ workoutId }: SessionViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The exercise order was frozen by the exercise-list editor into
  // the URL. Read once on mount.
  const sessionExercises = useMemo(() => {
    const ids = (searchParams.get("exercises") ?? "")
      .split(",")
      .filter(Boolean);
    return ids
      .map((id) => allExercises.find((e) => e.id === id))
      .filter((e) => e !== undefined);
  }, [searchParams]);

  const [screen, setScreen] = useState<SessionScreen>("detail");
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [fistHeld, setFistHeld] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [volume, setVolume] = useState(0.6);
  const [pointingActive, setPointingActive] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Gesture-demo rotation. Gated by three things: the exit dialog
  // being open, the initial delay not having elapsed yet, and
  // recent mouse activity
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoDelayElapsed, setDemoDelayElapsed] = useState(false);
  const [mouseIdle, setMouseIdle] = useState(true);
  const lastMouseMoveRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(
      () => setDemoDelayElapsed(true),
      DEMO_INITIAL_DELAY_MS,
    );
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      lastMouseMoveRef.current = Date.now();
      setMouseIdle(false);
    };
    window.addEventListener("mousemove", handleMouseMove);

    const idleCheck = setInterval(() => {
      if (Date.now() - lastMouseMoveRef.current >= MOUSE_IDLE_MS) {
        setMouseIdle(true);
      }
    }, 500);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(idleCheck);
    };
  }, []);

  const demoRotationActive = !exitDialogOpen && demoDelayElapsed && mouseIdle;

  useEffect(() => {
    if (!demoRotationActive) return;
    const id = setInterval(() => {
      setDemoIndex((i) => (i + 1) % DEMO_ROTATION.length);
    }, DEMO_SLOT_MS);
    return () => clearInterval(id);
  }, [demoRotationActive]);

  const activeDemoTarget = demoRotationActive ? DEMO_ROTATION[demoIndex] : null;

  const current = sessionExercises[index];

  const activeContext: SessionContext = exitDialogOpen
    ? "exit-confirm"
    : screen;

  const {
    videoRef,
    status: cameraStatus,
    error: cameraError,
    enable: enableCamera,
    disable: disableCamera,
  } = useWebcam(WEBCAM_CONSTRAINTS);

  const gestures = useMemo(
    () => [
      new PinchGesture({
        activateThreshold: 0.2,
        deactivateThreshold: 0.32,
        dwellTimeMs: 3000,
      }),
      new SwipeGesture(),
      new PauseGesture({
        activateExtendedThreshold: 0.6,
        releaseExtendedThreshold: 0.45,
        thumbAbductionThreshold: 0.35,
      }),
      new PointingGesture(),
      new FistGesture(),
    ],
    [],
  );

  const pauseSession = useCallback(() => {
    setPaused(true);
    audioRef.current?.pause();
  }, []);

  const resumeSession = useCallback(() => {
    setPaused(false);
    audioRef.current?.play().catch(() => {});
  }, []);

  const goToExercise = useCallback((next: number, dir: 1 | -1) => {
    setDirection(dir);
    setIndex(next);
    setScreen("detail");
    setPaused(false);
  }, []);

  const startTimer = useCallback(() => {
    if (!current) return;
    setSecondsLeft(current.durationSeconds);
    setPaused(false);
    setScreen("active");
  }, [current]);

  const finishSession = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    router.push(`/workouts/${workoutId}`);
  }, [router, workoutId]);

  const advance = useCallback(() => {
    if (index + 1 < sessionExercises.length) {
      goToExercise(index + 1, 1);
    } else {
      finishSession();
    }
  }, [index, sessionExercises.length, goToExercise, finishSession]);

  const goBack = useCallback(() => {
    if (index - 1 >= 0) goToExercise(index - 1, -1);
  }, [index, goToExercise]);

  const openExitDialog = useCallback(() => {
    setExitDialogOpen(true);
    audioRef.current?.pause();
  }, []);

  const handleVolumeChange = useCallback((next: number) => {
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }, []);

  const handleControlClick = useCallback(() => {
    if (screen === "detail") {
      startTimer();
    } else if (paused) {
      resumeSession();
    } else {
      pauseSession();
    }
  }, [screen, paused, startTimer, resumeSession, pauseSession]);

  const handleLeftClick = useCallback(() => {
    if (screen === "detail") goBack();
    else setScreen("detail");
  }, [screen, goBack]);

  const handleRightClick = useCallback(() => {
    if (screen === "detail") advance();
    else setScreen("detail");
  }, [screen, advance]);

  const { processFrame, pinchProgress } = useGestureRecognizer<SessionContext>({
    gestures,
    activeContext,
    handlers: {
      // pinch-start now (not pinch-end): with dwellTimeMs raised
      // to 3s above, pinch-start already only fires once the full
      // hold completes — the library's PinchGesture doesn't fire
      // it early. Using pinch-end here as well would just mean
      // "wait for release too", an extra, unnecessary step after
      // the hold is already done.
      "pinch-start": {
        contexts: ["detail"],
        handler: () => startTimer(),
      },
      "swipe-left": {
        contexts: ["detail", "active"],
        handler: handleRightClick,
      },
      "swipe-right": {
        contexts: ["detail", "active"],
        handler: handleLeftClick,
      },
      "pause-start": {
        contexts: ["active"],
        handler: pauseSession,
      },
      "pause-end": {
        contexts: ["active"],
        handler: resumeSession,
      },
      "pointing-start": {
        contexts: ["detail", "active"],
        handler: () => setPointingActive(true),
      },
      "pointing-move": {
        contexts: ["detail", "active"],
        handler: (event) => {
          const next = Math.max(0, Math.min(1, 1 - event.y));
          handleVolumeChange(next);
        },
      },
      "pointing-end": {
        contexts: ["detail", "active"],
        handler: () => setPointingActive(false),
      },
      "fist-start": {
        contexts: ["detail", "active", "exit-confirm"],
        handler: () => {
          setFistHeld(true);
          setExitDialogOpen(true);
          audioRef.current?.pause();
        },
      },
      "fist-end": {
        contexts: ["detail", "active", "exit-confirm"],
        handler: () => {
          setFistHeld(false);
          if (!paused) {
            audioRef.current?.play().catch(() => {});
          }
        },
      },
    },
  });

  useDetectionLoop({
    videoRef,
    active: cameraStatus === "running",
    onResult: (result: HandLandmarkerResult, timestamp: number) => {
      processFrame(result, timestamp);
    },
  });

  // Initial music playback + volume, attempted once on mount
  useEffect(() => {
    if (!MUSIC_TRACK_URL || !audioRef.current) return;
    audioRef.current.volume = volume;
    audioRef.current.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown
  useEffect(() => {
    if (screen !== "active" || paused || exitDialogOpen) return;
    if (secondsLeft <= 0) {
      advance();
      return;
    }
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [screen, paused, secondsLeft, exitDialogOpen, advance]);

  const totalDuration = current?.durationSeconds ?? 1;
  const progress =
    screen === "active" ? 1 - secondsLeft / totalDuration : pinchProgress;
  const controlState =
    screen === "detail" ? "idle" : paused ? "paused" : "running";

  if (sessionExercises.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-50"
      >
        <CornerFrame>
          <p className="text-lg text-white">
            No exercises selected for this session.
          </p>
          <button
            className="mt-4 text-sm text-white/60 underline hover:text-white"
            onClick={() => router.push(`/workouts/${workoutId}`)}
          >
            Back to workout setup
          </button>
        </CornerFrame>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="fixed inset-0 z-50"
    >
      <CornerFrame>
        <CameraStatusPanel
          status={cameraStatus}
          error={cameraError}
          onEnable={enableCamera}
          onDisable={disableCamera}
        />

        <video ref={videoRef} autoPlay playsInline muted className="hidden" />

        {MUSIC_TRACK_URL && (
          <audio
            ref={audioRef}
            src={MUSIC_TRACK_URL}
            loop
            crossOrigin="anonymous"
            className="hidden"
          />
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={openExitDialog}
          aria-label="Close and end workout"
          className="absolute top-14 right-14 size-10 justify-center"
        >
          <X className="size-5" />
        </Button>

        {current && (
          <div className="flex items-center gap-4 md:gap-10">
            <NavArrowButton
              direction="left"
              label={
                screen === "detail" ? "Previous exercise" : "Back to exercise"
              }
              onClick={handleLeftClick}
              demoVideoSrc={gestureDemoVideos.swipeRight}
              isDemoing={activeDemoTarget === "left"}
            />

            <div className="relative w-full max-w-4xl overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex flex-col items-center gap-6 text-center"
                >
                  <ExerciseMedia
                    videoSrc={current.videoSrc}
                    name={current.name}
                  />

                  <div>
                    <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
                      {current.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {index + 1} of {sessionExercises.length}
                    </p>
                  </div>

                  {screen === "detail" && (
                    <p className="text-muted-foreground">
                      {current.description}
                    </p>
                  )}

                  <SessionControlButton
                    state={controlState}
                    progress={progress}
                    secondsLeft={secondsLeft}
                    onClick={handleControlClick}
                    demoVideoSrc={gestureDemoVideos.pinch}
                    isDemoing={activeDemoTarget === "control"}
                  />

                  <EndWorkoutButton
                    onClick={openExitDialog}
                    demoVideoSrc={gestureDemoVideos.fist}
                    isDemoing={activeDemoTarget === "exit"}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <NavArrowButton
              direction="right"
              label={screen === "detail" ? "Next exercise" : "Back to exercise"}
              onClick={handleRightClick}
              demoVideoSrc={gestureDemoVideos.swipeLeft}
              isDemoing={activeDemoTarget === "right"}
            />
          </div>
        )}

        {MUSIC_TRACK_URL && (
          <MusicVisualizer
            audioRef={audioRef}
            active={!paused && !exitDialogOpen}
          />
        )}

        <GestureLegend screen={screen} />

        <VolumeIndicator
          volume={volume}
          onVolumeChange={handleVolumeChange}
          expanded={pointingActive}
          isDemoing={activeDemoTarget === "volume"}
        />
      </CornerFrame>

      <ExitConfirmDialog
        open={exitDialogOpen}
        fistHeld={fistHeld}
        holdDurationMs={FIST_HOLD_MS}
        onConfirm={finishSession}
        onCancel={() => setExitDialogOpen(false)}
      />
    </motion.div>
  );
}
