import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useEffect, useState } from "react";
import { extractColors } from "@/lib/utils/color-extractor";
import { MeshGradient } from "../mesh-gradient/mesh-gradient-background";
import { motion } from "framer-motion";

interface LyricSheetBackgroundProps {
  onColorsChange?: (colors: [number, number, number][]) => void;
}

export const DEFAULT_LYRIC_SHEET_COLORS: [number, number, number][] = [
  [0.1, 0.1, 0.18],
  [0.09, 0.07, 0.24],
  [0.06, 0.2, 0.38],
  [0.12, 0.08, 0.3],
  [0.1, 0.1, 0.18],
];

export function LyricSheetBackground({
  onColorsChange,
}: LyricSheetBackgroundProps) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;

  const [colors, setColors] = useState<[number, number, number][]>(
    DEFAULT_LYRIC_SHEET_COLORS,
  );

  useEffect(() => {
    async function getColors() {
      if (!coverUrl) return;
      const nextColors = (await extractColors(coverUrl)) as [
        number,
        number,
        number,
      ][];
      setColors(nextColors);
      onColorsChange?.(nextColors);
    }

    getColors();
  }, [coverUrl, onColorsChange]);

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 1.035, filter: "blur(20px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      style={{ willChange: "transform, opacity, filter" }}
    >
      <div className="w-full h-full relative">
        <MeshGradient colors={colors} />
      </div>
    </motion.div>
  );
}
