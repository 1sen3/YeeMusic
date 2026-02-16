import { usePlayerStore } from "@/lib/store/playerStore";
import { YeeSlider } from "../yee-slider";
import { formatDuration } from "@/lib/utils";

export function PlayerBarSlider() {
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const currentTime = usePlayerStore((s) => s.currentTime);

  return (
    <div className="absolute left-0 bottom-0 w-full px-8 rounded-b-full">
      <YeeSlider
        value={[progress]}
        onValueChange={seek}
        max={100}
        step={0.1}
        tooltip={formatDuration(currentTime)}
        trackClassName="bg-black/5"
        rangeClassName="bg-black"
      />
    </div>
  );
}
