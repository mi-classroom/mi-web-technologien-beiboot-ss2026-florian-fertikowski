/**
 * Requests camera permission and attaches a MediaStream to the
 * returned video ref. Reports readiness and any error via state.
 *
 * Reused pattern from the spike demo, extracted here so the
 * reha-demo has its own copy without importing from the other
 * workspace (this app treats the library as its only shared
 * dependency).
 */

import { useEffect, useRef, useState } from "react";

interface WebcamState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ready: boolean;
  error: string | null;
}

export function useWebcam(constraints: MediaStreamConstraints): WebcamState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [constraints]);

  return { videoRef, ready, error };
}
