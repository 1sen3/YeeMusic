import { usePlayerStore } from "@/lib/store/playerStore";
import { YeeSlider } from "../yee-slider";
import { formatDuration } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Vibrant } from "node-vibrant/browser";
import { useTheme } from "../providers/theme-provider";

export function PlayerBarSlider() {
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const currentTime = usePlayerStore((s) => s.currentTime);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl;
  const [coverColor, setCoverColor] = useState("");

  const { theme } = useTheme();

  useEffect(() => {
    if (!coverUrl) return;

    const v = new Vibrant(coverUrl);
    v.getPalette().then((palette) => {
      const vibrant =
        theme === "dark" ? palette.Vibrant?.hex : palette.DarkVibrant?.hex;
      setCoverColor(vibrant || "rgba(0, 0, 0, 0)");
    });
  }, [coverUrl]);

  return (
    <div
      className="absolute w-full top-0"
      style={
        {
          "--dynamic-cover-color": coverColor || "black",
        } as React.CSSProperties
      }
    >
      <YeeSlider
        value={[progress]}
        onValueChange={seek}
        max={100}
        step={0.1}
        tooltip={formatDuration(currentTime)}
        trackClassName="bg-background/60 rounded-none"
        rangeClassName="bg-[var(--dynamic-cover-color)] rounded-r-full rounded-l-none"
      />
    </div>
  );
}
