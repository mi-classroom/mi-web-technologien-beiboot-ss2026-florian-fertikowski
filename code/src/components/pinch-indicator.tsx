/**
 * Visual indicator for the pinch gesture.
 *
 * Renders a small circle at the pinch position for each hand.
 * The circle's appearance reflects the detector's phase:
 * idle: nothing
 * candidate: outline ring that fills up over the dwell time
 * active: solid filled circle in a contrast color
 */

import type { PinchDetectorState } from "../gestures";

interface PinchIndicatorProps {
  state: PinchDetectorState;
}

export function PinchIndicator({ state }: PinchIndicatorProps) {
  return (
    <div className="pointer-events-none absolute inset-0 -scale-x-100">
      {state.hands.map((hand) => {
        if (hand.phase === "idle") return null;

        const isActive = hand.phase === "active";
        const sizePx = isActive ? 56 : 48;

        const positionStyle: React.CSSProperties = {
          left: `${hand.position.x * 100}%`,
          top: `${hand.position.y * 100}%`,
          width: sizePx,
          height: sizePx,
          transform: "translate(-50%, -50%)",
        };

        if (isActive) {
          return (
            <div
              key={hand.handIndex}
              className="absolute rounded-full bg-cyan-400/80 ring-4 ring-cyan-200"
              style={positionStyle}
            />
          );
        }

        const radius = (sizePx - 6) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference * (1 - hand.progress);

        return (
          <div key={hand.handIndex} className="absolute" style={positionStyle}>
            <svg
              viewBox={`0 0 ${sizePx} ${sizePx}`}
              width={sizePx}
              height={sizePx}
            >
              {/* Background ring */}
              <circle
                cx={sizePx / 2}
                cy={sizePx / 2}
                r={radius}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={4}
                fill="none"
              />
              {/* Progress ring */}
              <circle
                cx={sizePx / 2}
                cy={sizePx / 2}
                r={radius}
                stroke="#5eead4"
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${sizePx / 2} ${sizePx / 2})`}
                style={{ transition: "stroke-dashoffset 60ms linear" }}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}
