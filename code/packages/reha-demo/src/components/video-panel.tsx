/**
 * Small webcam preview in a corner of the screen. Renders the
 * actual video element (via the ref passed in) plus an optional
 * overlay message from gesture feedback.
 *
 * The video is CSS-mirrored so the user sees a natural "mirror"
 * view.
 */

import type { RefObject } from "react";

interface VideoPanelProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  message?: string | null;
  statusText?: string;
}

export function VideoPanel({ videoRef, message, statusText }: VideoPanelProps) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-30 w-60 overflow-hidden bg-black shadow-xl">
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full -scale-x-100 object-cover"
        />

        {statusText && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-xs uppercase tracking-widest">
            {statusText}
          </div>
        )}

        {message && (
          <div className="pointer-events-none absolute inset-x-2 top-2 rounded-md bg-black/70 px-2 py-1 text-center font-mono text-xs text-white backdrop-blur-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
