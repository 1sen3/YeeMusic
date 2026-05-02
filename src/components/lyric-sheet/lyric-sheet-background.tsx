import { usePlayerStore } from "@/lib/store/playerStore";
// import { useSettingStore } from "@/lib/store/settingStore";
// import { MeshGradient } from "@paper-design/shaders-react";
import { useEffect, useState } from "react";
import { extractColors } from "@/lib/utils/color-extractor";
import { MeshGradientBackground } from "../mesh-gradient-background";
// import { BackgroundRender } from "@applemusic-like-lyrics/react";
// import { MeshGradientRenderer } from "@applemusic-like-lyrics/react";

export function LyricSheetBackground() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;
  // const meshGradientProps = useSettingStore((s) => s.appearance.meshGradient);

  // const [gradientColors, setGradientColors] = useState<string[]>([
  //   "#1a1a2e",
  //   "#16213e",
  //   "#0f3460",
  //   "#1a1a2e",
  // ]);

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

      // const gradientColors = colors.map(([r, g, b]) => {
      //   const toHex = (v: number) =>
      //     Math.round(v * 255)
      //       .toString(16)
      //       .padStart(2, "0");
      //   return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      // });

      // setGradientColors(gradientColors);
      setColors(colors as [number, number, number][]);
    }

    getColors();
  }, [coverUrl]);

  const speed = isPlaying ? 1.0 : 0;

  return (
    <div className="absolute inset-0">
      <div className="w-full h-full relative">
        {/* <MeshGradient
          colors={gradientColors}
          distortion={meshGradientProps.distortion}
          swirl={meshGradientProps.swirl}
          grainMixer={meshGradientProps.grainMixer}
          grainOverlay={meshGradientProps.grainOverlay}
          speed={isPlaying ? meshGradientProps.speed : 0}
          className="w-full h-full"
        /> */}

        {/* <BackgroundRender
          album={coverUrl}
          playing={isPlaying}
          renderer={MeshGradientRenderer}
          fps={60}
        /> */}

        <MeshGradientBackground colors={colors} speed={speed} />

        <div className="absolute top-0 left-0 w-full h-full bg-black/20"></div>
      </div>
    </div>
  );
}
