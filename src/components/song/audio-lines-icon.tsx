import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";

export function AudioLinesIcon({
  className,
  size = 20,
}: {
  className?: string;
  size?: number;
}) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  return (
    <div className={cn(className)}>
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M2 10v3" />
        <motion.path
          animate={isPlaying ? "animate" : "normal"}
          d="M6 6v11"
          variants={{
            normal: { d: "M6 6v11" },
            animate: {
              d: ["M6 6v11", "M6 10v3", "M6 6v11"],
              transition: {
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          }}
        />
        <motion.path
          animate={isPlaying ? "animate" : "normal"}
          d="M10 3v18"
          variants={{
            normal: { d: "M10 3v18" },
            animate: {
              d: ["M10 3v18", "M10 9v5", "M10 3v18"],
              transition: {
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          }}
        />
        <motion.path
          animate={isPlaying ? "animate" : "normal"}
          d="M14 8v7"
          variants={{
            normal: { d: "M14 8v7" },
            animate: {
              d: ["M14 8v7", "M14 6v11", "M14 8v7"],
              transition: {
                duration: 0.8,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          }}
        />
        <motion.path
          animate={isPlaying ? "animate" : "normal"}
          d="M18 5v13"
          variants={{
            normal: { d: "M18 5v13" },
            animate: {
              d: ["M18 5v13", "M18 7v9", "M18 5v13"],
              transition: {
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
              },
            },
          }}
        />
        <path d="M22 10v3" />
      </svg>
    </div>
  );
}
