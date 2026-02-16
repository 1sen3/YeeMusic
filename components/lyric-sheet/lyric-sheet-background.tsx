import { usePlayerStore } from "@/lib/store/playerStore";
import { MeshGradient } from "@paper-design/shaders-react";
import { Vibrant } from "node-vibrant/browser";
import { useEffect, useState } from "react";

export function LyricSheetBackground() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl;

  const [gradientColors, setGradientColors] = useState<string[]>([
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#1a1a2e",
  ]);

  useEffect(() => {
    if (!coverUrl) return;

    const v = new Vibrant(coverUrl);
    v.getPalette()
      .then((palette) => {
        const muted = palette.Muted?.hex;
        const darkMuted = palette.DarkMuted?.hex;
        const darkVibrant = palette.DarkVibrant?.hex;
        const vibrant = palette.Vibrant?.hex;

        setGradientColors([
          muted || "",
          darkMuted || "",
          darkVibrant || "",
          vibrant || "",
        ]);
      })
      .catch((e: unknown) => console.log(e));
  }, [coverUrl]);

  return (
    <div className="absolute inset-0">
      <MeshGradient
        colors={gradientColors}
        distortion={1}
        swirl={0.1}
        speed={isPlaying ? 0.8 : 0}
        grainMixer={0.2}
        grainOverlay={0.1}
        className="w-full h-full"
      />
    </div>
  );
}
