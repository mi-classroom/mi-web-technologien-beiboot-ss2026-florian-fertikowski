"use client";

/**
 * Decides whether the "End workout" button gets its own row
 * (stacked, more breathing room) or joins the control-button row
 * (inline, saves vertical space).
 *
 * Deliberately checks *both* width and height, not width alone.
 * A pure width breakpoint (e.g. "1024px+ = stacked") assumes wide
 * screens always have generous height too, which is false for the
 * extremely common case of a 1920x1080 laptop panel: plenty wide,
 * but with the OS taskbar and browser chrome eating a few hundred
 * px of vertical space, the actually-usable viewport height can
 * end up shorter than an external monitor's despite the identical
 * reported resolution. The stacked layout's cumulative height
 * (video + text + control button + end-workout button, each in
 * its own row) comfortably exceeds that on a real laptop, forcing
 * a scrollbar into what's meant to be a glanceable, fixed screen.
 *
 * Threshold values are deliberately generous rather than tightly
 * tuned to one specific laptop's exact numbers — "inline" is the
 * safe default; "stacked" only kicks in once there's clearly
 * enough width *and* height to spare.
 */

import { useEffect, useState } from "react";

const MIN_WIDTH_FOR_STACKED = 1024;
const MIN_HEIGHT_FOR_STACKED = 900;

export type EndWorkoutLayout = "stacked" | "inline";

export function useEndWorkoutLayout(): EndWorkoutLayout {
  const [layout, setLayout] = useState<EndWorkoutLayout>("inline");

  useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (width < 768) {
        // Mobile: own row below, matching the two nav arrows that
        // already fill the shared row with the control button.
        setLayout("stacked");
        return;
      }

      setLayout(
        width >= MIN_WIDTH_FOR_STACKED && height >= MIN_HEIGHT_FOR_STACKED
          ? "stacked"
          : "inline",
      );
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return layout;
}
