/**
 * Full-viewport overlay for the pointing cursor. Positioned
 * absolutely, `pointer-events-none` so it never blocks clicks.
 *
 * Position is in normalized [0, 1] coordinates aligned with the
 * viewport. The parent App is responsible for mapping the
 * library's position (which is in webcam-frame coordinates) to
 * viewport coordinates — you may want to scale/invert.
 *
 * The cursor is null when no pointing gesture is active.
 */

interface CursorOverlayProps {
  position: { x: number; y: number } | null;
}

export function CursorOverlay({ position }: CursorOverlayProps) {
  if (!position) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40"
      aria-hidden="true"
    >
      <div
        className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black opacity-80 shadow-lg ring-2 ring-white/40"
        style={{
          left: `${position.x * 100}%`,
          top: `${position.y * 100}%`,
        }}
      />
    </div>
  );
}
