/**
 * Toast-style overlay that displays the most recently recognized gesture.
 */

interface GestureFeedbackProps {
  message: string | null;
}

export function GestureFeedback({ message }: GestureFeedbackProps) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-lg bg-black/70 px-4 py-2 font-mono text-lg text-white shadow-lg backdrop-blur-sm transition-opacity duration-300 ${
        message ? "opacity-100" : "opacity-0"
      }`}
    >
      {message ?? ""}
    </div>
  );
}
