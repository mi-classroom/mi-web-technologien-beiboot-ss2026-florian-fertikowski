"use client";

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";

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
 * Always-present reference list, bottom-left: which gestures work
 * right now and what they do. Icons, not the video demos
 * This is a lookup a user can glance at any time, separate from
 * the periodic rotating video demos elsewhere on screen. Content
 * changes with the current screen, since e.g. pinch only starts
 * something in "detail", not "active".
 */
export function GestureLegend({ screen }: GestureLegendProps) {
  const entries = getEntries(screen);

  return (
    <Card className="absolute bottom-14 left-14 text-lg">
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
  );
}
