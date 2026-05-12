import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useEffect, useState } from "react";
import { extractColors } from "@/lib/utils/color-extractor";
import { MeshGradient } from "../mesh-gradient/mesh-gradient-background";

export function LyricSheetBackground() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;

  const [colors, setColors] = useState<[number, number, number][]>([
    [0.1, 0.1, 0.18],
    [0.09, 0.07, 0.24],
    [0.06, 0.2, 0.38],
    [0.12, 0.08, 0.3],
    [0.1, 0.1, 0.18],
  ]);

  useEffect(() => {
    async function getColors() {
      if (!coverUrl) return;
      const colors = await extractColors(coverUrl);
      setColors(colors as [number, number, number][]);
    }

    getColors();
  }, [coverUrl]);

  return (
    <div className="absolute inset-0">
      <div className="w-full h-full relative">
        <MeshGradient colors={colors} />

        <div className="absolute top-0 left-0 w-full h-full bg-black/10" />
      </div>
    </div>
  );
}
