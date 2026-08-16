import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Full-viewport wrapper for Big Picture Mode: four camera-viewfinder-style
 * corner brackets framing the content area. Purely aesthetic —
 * evokes "gesture recognition is active here" without actually
 * showing a camera preview
 */
export function CornerFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-background p-8 md:p-16">
      <CornerBracket corner="tl" />
      <CornerBracket corner="tr" />
      <CornerBracket corner="bl" />
      <CornerBracket corner="br" />
      {children}
    </div>
  );
}

function CornerBracket({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const cornerStyles: Record<typeof corner, string> = {
    tl: "top-4 left-4 md:top-8 md:left-8 border-t-2 border-l-2 rounded-tl-2xl",
    tr: "top-4 right-4 md:top-8 md:right-8 border-t-2 border-r-2 rounded-tr-2xl",
    bl: "bottom-4 left-4 md:bottom-8 md:left-8 border-b-2 border-l-2 rounded-bl-2xl",
    br: "bottom-4 right-4 md:bottom-8 md:right-8 border-b-2 border-r-2 rounded-br-2xl",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute h-10 w-10 border-muted-foreground/40 md:h-14 md:w-14",
        cornerStyles[corner],
      )}
    />
  );
}
