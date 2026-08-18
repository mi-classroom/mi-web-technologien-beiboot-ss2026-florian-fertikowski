"use client";

/**
 * Requests camera permission and attaches a MediaStream to the
 * returned video ref. Unlike the original version (which only
 * ever auto-started once on mount), this exposes an explicit
 * status plus enable()/disable() so a consumer can build a real
 * status UI: retry after an error, cancel a pending permission
 * request, or let the user turn the camera off/on deliberately —
 * e.g. to fall back to mouse-only control for the rest of a
 * session without reloading the page.
 *
 * Status meanings:
 * - "starting": a getUserMedia() call is in flight.
 * - "running": stream attached and playing.
 * - "error": the last attempt failed; `error` holds the message.
 * - "disabled": no active attempt — either the user called
 *   disable() themselves, or (see below) an in-flight attempt was
 *   cancelled.
 *
 * disable() doubles as "cancel a pending start": the browser's own
 * permission prompt can't be dismissed programmatically, but once
 * the user has committed to disabling, `cancelledRef` makes the
 * eventual resolution of that prompt (grant or deny) a no-op
 * instead of transitioning to "running" or "error" — the state the
 * user asked for wins.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type CameraStatus = "starting" | "running" | "error" | "disabled";

interface WebcamState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: string | null;
  enable: () => void;
  disable: () => void;
}

export function useWebcam(constraints: MediaStreamConstraints): WebcamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelledRef = useRef(false);

  const [status, setStatus] = useState<CameraStatus>("starting");
  const [error, setError] = useState<string | null>(null);
  // Bumped by enable() to trigger a fresh attempt even if the
  // status was already "starting" from a prior failed/cancelled try.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (status !== "starting") return;
    cancelledRef.current = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelledRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        if (!cancelledRef.current) setStatus("running");
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
    // `attempt` is the deliberate re-trigger; constraints changing
    // mid-session isn't a case this app hits in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  const disable = useCallback(() => {
    cancelledRef.current = true; // no-ops any in-flight attempt
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setError(null);
    setStatus("disabled");
  }, []);

  const enable = useCallback(() => {
    setError(null);
    setStatus("starting");
    setAttempt((a) => a + 1);
  }, []);

  // Real unmount (not just a status change) — always release the
  // camera regardless of what status we were in.
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, status, error, enable, disable };
}
