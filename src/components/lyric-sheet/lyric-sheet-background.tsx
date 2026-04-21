import { usePlayerStore } from "@/lib/store/playerStore";
import { useSettingStore } from "@/lib/store/settingStore";
import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import { extractColors } from "extract-colors";
// import { BackgroundRender } from "@applemusic-like-lyrics/react";
// import { MeshGradientRenderer } from "@applemusic-like-lyrics/react";

export function LyricSheetBackground() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;
  const meshGradientProps = useSettingStore((s) => s.appearance.meshGradient);

  const [gradientColors, setGradientColors] = useState<string[]>([
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#1a1a2e",
  ]);

  useEffect(() => {
    async function getColors() {
      if (!coverUrl) return;

      const colors = await extractColors(coverUrl, {
        pixels: 64000,
        distance: 0.22,
        colorValidator: (_r, _g, _b, alpha) => alpha > 250,
        saturationDistance: 0.2,
        lightnessDistance: 0.2,
        hueDistance: 0.0833,
      });

      const gradientColors = colors
        .filter((c) => c.lightness > 0.28 && c.lightness < 0.9)
        .filter((c) => c.saturation > 0.18)
        .sort((a, b) => b.area - a.area)
        .map((c) => c.hex);

      setGradientColors(
        gradientColors.length > 0 ? gradientColors : colors.map((c) => c.hex),
      );
    }

    getColors();
  }, [coverUrl]);

  return (
    <div className="absolute inset-0">
      <div className="w-full h-full relative">
        <MeshGradient
          colors={gradientColors}
          distortion={meshGradientProps.distortion}
          swirl={meshGradientProps.swirl}
          grainMixer={meshGradientProps.grainMixer}
          grainOverlay={meshGradientProps.grainOverlay}
          speed={isPlaying ? meshGradientProps.speed : 0}
          className="w-full h-full"
        />

        {/* <BackgroundRender
          album={coverUrl}
          playing={isPlaying}
          renderer={MeshGradientRenderer}
          fps={60}
        /> */}

        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
      </div>
    </div>
  );
}
