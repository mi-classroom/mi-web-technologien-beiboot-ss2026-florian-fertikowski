/**
 * Renders the webcam video plus a transparent canvas overlay for
 * landmark visualization. Both elements sit exactly on top of each
 * other and are mirrored for natural webcam UX.
 */

import { forwardRef } from "react";

interface VideoStageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: string;
}

export const VideoStage = forwardRef<HTMLCanvasElement, VideoStageProps>(
  function VideoStage({ videoRef, status }, canvasRef) {
    return (
      <div className="relative aspect-video overflow-hidden bg-white">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100"
        />
        <div className="px-2 absolute bottom-2 left-2 bg-gray-400/60 text-white">
          {status}
        </div>
      </div>
    );
  },
);
