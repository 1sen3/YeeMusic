import { YeeButton } from "../yee-button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import {
  sfSpeaker,
  sfSpeakerWave1,
  sfSpeakerWave2,
  sfSpeakerWave3,
} from "@bradleyhodges/sfsymbols";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { cn } from "@/lib/utils";

export function PlayerBarVolumePopover() {
  const volume = usePlayerStore((s) => s.volume);
  const updateVolume = usePlayerStore((s) => s.updateVolume);

  const VolumeButton =
    volume === 0
      ? sfSpeaker
      : volume < 0.3
        ? sfSpeakerWave1
        : volume < 0.7
          ? sfSpeakerWave2
          : sfSpeakerWave3;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <YeeButton
          variant="ghost"
          icon={
            <div className="flex items-center justify-center">
              <SFIcon
                icon={VolumeButton}
                className={cn(
                  volume < 0.3 && "size-3",
                  volume >= 0.3 && "size-4",
                )}
              />
            </div>
          }
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={32}
        className="w-56 rounded-lg mr-2 p-4 bg-card/80 backdrop-blur-md"
      >
        <div className="flex gap-2 items-center">
          <div className="flex items-center justify-center">
            <SFIcon
              icon={VolumeButton}
              className={cn(
                volume < 0.3 && "size-3",
                volume >= 0.3 && "size-4",
              )}
            />
          </div>
          <Slider
            value={[volume]}
            onValueChange={(value) => updateVolume(value[0])}
            max={1}
            step={0.01}
            className="flex-1"
          />
          <span className="w-6 text-right text-foreground/80 text-xs select-none">
            {Math.round(volume * 100)}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
