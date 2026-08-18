"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GestureLegendEntry {
  icon: string;
  label: string;
}

function getEntries(screen: "detail" | "active"): GestureLegendEntry[] {
  const primary: GestureLegendEntry =
    screen === "detail"
      ? { icon: "🤏", label: "Starten" }
      : { icon: "🖐", label: "Pause" };

  return [
    primary,
    { icon: "👈👉", label: screen === "detail" ? "Wechseln" : "Zurück" },
    { icon: "👉", label: "Lautstärke" },
    { icon: "✊", label: "Beenden" },
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
      <Card className="absolute bottom-14 left-14 hidden text-lg md:block">
        <CardHeader>
          <CardTitle>Gesten</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5">
          {entries.map((entry) => (
            <div key={entry.label} className="flex items-center gap-2">
              <span className="w-6 text-center" aria-hidden="true">
                {entry.icon}
              </span>
              <span>{entry.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Gesten anzeigen"
        className="absolute bottom-6 left-6 flex size-10 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white/70 backdrop-blur-sm md:hidden"
      >
        <HelpCircle className="size-5" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gesten</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-lg">
            {entries.map((entry) => (
              <div key={entry.label} className="flex items-center gap-3">
                <span className="w-6 text-center" aria-hidden="true">
                  {entry.icon}
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
