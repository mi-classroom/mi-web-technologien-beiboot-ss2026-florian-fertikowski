/**
 * React hook that calls `navigator.mediaDevices.getUserMedia`,
 * attaches the stream to a <video> element, and handles cleanup.
 *
 * Note: This file is React-specific and will not move into the library.
 * The library will ship its own framework-agnostic webcam handling.
 */

import { useEffect, useRef, useState } from "react";

interface UseWebcamResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  ready: boolean;
  error: string | null;
  resolution: { width: number; height: number } | null;
}

export function useWebcam(
  constraints: MediaStreamConstraints,
): UseWebcamResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{
    width: number;
    height: number;
  } | null>(null);

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
        if (!video) return;

        video.srcObject = stream;

        await new Promise<void>((res) => {
          video.onloadedmetadata = () => res();
        });
        await video.play();

        // Read the actual negotiated values, the camera may have
        // chosen a different resolution than requested.
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        setResolution({
          width: settings.width ?? video.videoWidth,
          height: settings.height ?? video.videoHeight,
        });
        setReady(true);
      } catch (err) {
        setError((err as Error).message);
      }
    })();

    // Cleanup: stop all tracks
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, ready, error, resolution };
}
