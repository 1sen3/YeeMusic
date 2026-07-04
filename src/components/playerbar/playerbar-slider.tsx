import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { YeeSlider } from "../yee-slider";
import { formatDuration } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Vibrant } from "node-vibrant/browser";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";

type DurationDisplayMode = "total" | "remaining";
const DURATION_DISPLAY_MODES: DurationDisplayMode[] = ["total", "remaining"];

export function PlayerBarSlider() {
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const duration = usePlayerStore((s) => s.duration);
  const [durationDisplayMode, setDurationDisplayMode] =
    useState<DurationDisplayMode>("total");

  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;
  const [coverColor, setCoverColor] = useState("");

  const theme = useSettingStore((s) => s.appearance.theme);

  useEffect(() => {
    if (!coverUrl) return;

    const v = new Vibrant(coverUrl);
    v.getPalette().then((palette) => {
      const vibrant =
        theme === "dark" ? palette.Vibrant?.hex : palette.DarkVibrant?.hex;
      setCoverColor(vibrant || "rgba(0, 0, 0, 0)");
    });
  }, [coverUrl]);

  const remainingTime = Math.max(duration - currentTime, 0);
  const durationText =
    durationDisplayMode === "remaining"
      ? `-${formatDuration(remainingTime)}`
      : formatDuration(duration);

  function toggleDurationDisplayMode() {
    setDurationDisplayMode((current) => {
      const currentIndex = DURATION_DISPLAY_MODES.indexOf(current);
      return DURATION_DISPLAY_MODES[
        (currentIndex + 1) % DURATION_DISPLAY_MODES.length
      ];
    });
  }

  return (
    <div
      className="flex min-w-0 items-center gap-2 px-2"
      style={
        {
          "--dynamic-cover-color": coverColor || "black",
        } as React.CSSProperties
      }
    >
      <span className="w-10 shrink-0 text-right text-xs font-light text-foreground/45 tabular-nums select-none">
        {formatDuration(currentTime)}
      </span>
      <YeeSlider
        value={[progress]}
        onValueChange={seek}
        max={100}
        step={0.1}
        hoverTooltip={(value) => formatDuration((duration * value) / 100)}
        className="h-8"
        trackClassName="h-1! bg-foreground/10"
        rangeClassName="bg-[var(--dynamic-cover-color)]"
        thumbClassName="relative block size-4 rounded-full bg-white opacity-100 shadow-[0_0_0_1px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.08)] before:absolute before:top-1/2 before:left-1/2 before:size-2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-[var(--dynamic-cover-color)] before:content-[''] before:transition-[width,height,opacity] before:duration-150 before:ease-out hover:before:size-2.5 active:before:size-1.5 active:before:opacity-65 data-[dragging]:before:size-1.5 data-[dragging]:before:opacity-65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
        showThumb
        showThumbTooltip={false}
      />
      <button
        type="button"
        className="flex h-7 w-12 shrink-0 items-center justify-center rounded-sm border-0 px-1 text-center text-xs font-light text-foreground/45 tabular-nums transition-colors duration-300 ease-out select-none hover:bg-foreground/10 hover:text-foreground/60"
        onClick={toggleDurationDisplayMode}
      >
        {durationText}
      </button>
    </div>
  );
}
