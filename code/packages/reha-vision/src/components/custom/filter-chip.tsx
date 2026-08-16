import { Button } from "@/components/ui/button";
import React from "react";

/**
 * Reusable Button Component used as Filtering Chip on the main page
* */
export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant={active ? "default" : "outline"}
    >
      {children}
    </Button>
  );
}
