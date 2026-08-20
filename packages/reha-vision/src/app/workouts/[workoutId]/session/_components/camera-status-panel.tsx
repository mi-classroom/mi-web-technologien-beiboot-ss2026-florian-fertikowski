"use client";

import { cn } from "@/lib/utils";
import type { CameraStatus } from "@/hooks/use-webcam";

interface CameraStatusPanelProps {
  status: CameraStatus;
  error: string | null;
  onEnable: () => void;
  onDisable: () => void;
}

const STATUS_TEXT: Record<CameraStatus, string> = {
  starting: "Kamera startet…",
  running: "Kamera aktiv",
  error: "Kamera-Fehler",
  disabled: "Kamera deaktiviert",
};

const STATUS_DOT_COLOR: Record<CameraStatus, string> = {
  starting: "bg-amber-400",
  running: "bg-emerald-400",
  error: "bg-red-500",
  disabled: "bg-white/40",
};

const STATUS_ACTION: Record<
  CameraStatus,
  { label: string; kind: "enable" | "disable" }
> = {
  starting: { label: "Abbrechen", kind: "disable" },
  running: { label: "Deaktivieren", kind: "disable" },
  error: { label: "Erneut versuchen", kind: "enable" },
  disabled: { label: "Aktivieren", kind: "enable" },
};

/**
 * Camera status pill, top of the session screen. Four states, with one
 * action each (see useWebcam's CameraStatus for the state definitions)
 */
export function CameraStatusPanel({
  status,
  onEnable,
  onDisable,
}: CameraStatusPanelProps) {
  const action = STATUS_ACTION[status];
  const handleClick = action.kind === "enable" ? onEnable : onDisable;

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs whitespace-nowrap text-white/80 backdrop-blur-sm md:text-sm">
      <span
        className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_COLOR[status])}
        aria-hidden="true"
      />
      <span>{STATUS_TEXT[status]}</span>
      <button
        type="button"
        onClick={handleClick}
        className="shrink-0 font-medium text-white underline-offset-4 hover:underline"
      >
        {action.label}
      </button>
    </div>
  );
}
