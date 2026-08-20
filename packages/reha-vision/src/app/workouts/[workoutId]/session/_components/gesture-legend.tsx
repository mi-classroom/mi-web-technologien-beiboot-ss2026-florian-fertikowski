"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import fist from "@/assets/fist.svg";
import palm from "@/assets/palm.svg";
import pinch from "@/assets/pinch.svg";
import swipe from "@/assets/swipe.svg";
import point from "@/assets/point.svg";

interface GestureLegendEntry {
  icon: string;
  label: string;
}

function getEntries(screen: "detail" | "active"): GestureLegendEntry[] {
  const primary: GestureLegendEntry =
    screen === "detail"
      ? { icon: pinch.src, label: "Starten" }
      : { icon: palm.src, label: "Pause" };

  return [
    primary,
    { icon: swipe.src, label: screen === "detail" ? "Wechseln" : "Zurück" },
    { icon: point.src, label: "Lautstärke" },
    { icon: fist.src, label: "Beenden" },
  ];
}

interface GestureLegendProps {
  screen: "detail" | "active";
}

/**
 * Which gestures work right now and what they do. Icons, not the
 * video demos — a lookup a user can check any time, separate from
 * the periodic rotating video demos elsewhere on screen. Content
 * changes with the current screen, since e.g. pinch only starts
 * something in "detail", not "active".
 */
export function GestureLegend({ screen }: GestureLegendProps) {
  const entries = getEntries(screen);
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="absolute bottom-14 left-14 hidden flex-col gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-lg text-white/80 backdrop-blur-sm md:flex">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center gap-3">
            <span className="w-8 text-center">
              <img
                className={"invert"}
                src={entry.icon}
                height={40}
                width={40}
                alt=""
              />
            </span>
            <span>{entry.label}</span>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Gesten anzeigen"
              className="absolute bottom-6 left-6 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 backdrop-blur-sm md:hidden"
            >
              <HelpCircle className="size-5" aria-hidden="true" />
            </button>
          }
        />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gesten</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-lg">
            {entries.map((entry) => (
              <div key={entry.label} className="flex items-center gap-3">
                <span className="w-6 text-center">
                  <img src={entry.icon} height={30} width={30} alt="" />
                </span>
                <span>{entry.label}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
