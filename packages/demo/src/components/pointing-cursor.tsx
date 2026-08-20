/**
 * Visual cursor for the pointing gesture.
 *
 * Renders a small dot at the latest pointing position, or nothing
 * if no pointing is active. Positioning mirrors PinchIndicator —
 * absolutely positioned inside the mirrored video container.
 *
 * The position prop is null when no pointing is active and an
 * (x, y) pair in normalized [0, 1] coordinates otherwise.
 */

interface PointingCursorProps {
  position: { x: number; y: number } | null;
}

export function PointingCursor({ position }: PointingCursorProps) {
  return (
    <div className="pointer-events-none absolute inset-0 -scale-x-100">
      {position && (
        <div
          className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-300 ring-2 ring-yellow-100 shadow-lg"
          style={{
            left: `${position.x * 100}%`,
            top: `${position.y * 100}%`,
          }}
        />
      )}
    </div>
  );
}
