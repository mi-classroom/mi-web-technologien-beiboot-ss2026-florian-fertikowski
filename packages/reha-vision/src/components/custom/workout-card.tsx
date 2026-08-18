"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ThumbnailImage } from "@/components/custom/thumbnail-image";

interface WorkoutCardProps {
  href: string;
  name: string;
  thumbnailSrc: string | undefined;
  exerciseCount: number;
  minutes: number;
}

/**
 * Entrance (mount) and exit (removed-by-filter) states. The "show"
 * transition doesn't set its own delay — WorkoutsList's grid
 * container supplies `staggerChildren`, and Framer Motion
 * propagates that timing to any descendant motion component that
 * declares matching variant names without its own explicit
 * initial/animate, which is exactly this component's situation.
 */
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
} as const;

/**
 * Grid card for a workout: full-bleed thumbnail with a bottom
 * gradient scrim carrying the name and meta info.
 */
export function WorkoutCard({
  href,
  name,
  thumbnailSrc,
  exerciseCount,
  minutes,
}: WorkoutCardProps) {
  return (
    <motion.div
      layout
      variants={cardVariants}
      exit="exit"
      className="relative aspect-[4/3] overflow-hidden rounded-xl"
    >
      <Link href={href} className="group absolute inset-0 block">
        <ThumbnailImage
          src={thumbnailSrc}
          className="absolute inset-0"
          imgClassName="transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 text-white">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-white/70">
            {exerciseCount} exercises · ~{minutes} min
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
