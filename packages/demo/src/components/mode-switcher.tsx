/**
 * Button row for switching between the three detection modes
 */

import type { ModeName } from "../detectors";

interface ModeSwitcherProps {
  mode: ModeName;
  onModeChange: (mode: ModeName) => void;
}

const MODES: ReadonlyArray<{ id: ModeName; label: string }> = [
  { id: "hands", label: "Hands" },
  { id: "pose", label: "Pose" },
  { id: "gesture", label: "Gesture" },
];

export function ModeSwitcher({ mode, onModeChange }: ModeSwitcherProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`border px-3.5 py-2 text-sm cursor-pointer bg-gray-100 ${
            mode === m.id ? "border-cyan-400" : "border-gray-400"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
