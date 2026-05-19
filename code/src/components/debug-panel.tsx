/**
 * Shows FPS, inference time, detection count, stream resolution,
 * and raw detection data as JSON.
 */

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface DebugPanelHandle {
  update(stats: {
    fps: number;
    inferenceMs: number;
    detectionCount: number;
    resultJson: string;
  }): void;
}

interface DebugPanelProps {
  resolution: { width: number; height: number } | null;
}

export const DebugPanel = forwardRef<DebugPanelHandle, DebugPanelProps>(
  function DebugPanel({ resolution }, ref) {
    const fpsRef = useRef<HTMLSpanElement>(null);
    const inferenceRef = useRef<HTMLSpanElement>(null);
    const countRef = useRef<HTMLSpanElement>(null);
    const dataRef = useRef<HTMLPreElement>(null);

    // useImperativeHandle exposes the `update` method to the parent
    useImperativeHandle(
      ref,
      () => ({
        update(stats) {
          if (fpsRef.current) fpsRef.current.textContent = stats.fps.toFixed(1);
          if (inferenceRef.current)
            inferenceRef.current.textContent = stats.inferenceMs.toFixed(1);
          if (countRef.current)
            countRef.current.textContent = String(stats.detectionCount);
          if (dataRef.current) dataRef.current.textContent = stats.resultJson;
        },
      }),
      [],
    );

    return (
      <aside className="flex flex-col gap-2 border bg-gray-200 p-3">
        <div className="flex flex-wrap gap-3 border-b pb-2 text-xs">
          <span>
            FPS:{" "}
            <strong className="font-mono" ref={fpsRef}>
              –
            </strong>
          </span>
          <span>
            Inference:{" "}
            <strong className="font-mono" ref={inferenceRef}>
              –
            </strong>{" "}
            ms
          </span>
          <span>
            Detections:{" "}
            <strong className="font-mono" ref={countRef}>
              0
            </strong>
          </span>
          {resolution && (
            <span>
              Stream:{" "}
              <strong className="font-mono">
                {resolution.width}×{resolution.height}
              </strong>
            </span>
          )}
        </div>
        <pre
          ref={dataRef}
          className="m-0 max-h-[70vh] overflow-auto whitespace-pre-wrap wrap-break-word font-mono text-xs"
        >
          {"{}"}
        </pre>
      </aside>
    );
  },
);
