import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { QUALITY_BY_KEY, QualityKey } from "@/lib/constants/song";
import { SongQualityDetail } from "@/lib/types/song";
import { cn, formatFileSize } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/playerStore";
import { ReactNode } from "react";

export function MusicLevelPopover({
  open,
  onOpenChange,
  side = "top",
  sideOffset = 48,
  contentClassName,
  className,
  children,
}: {
  open?: boolean;
  onOpenChange?: (value: boolean) => void;
  variant?: "light" | "dark";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  contentClassName?: string;
  className?: string;
  children?: ReactNode;
}) {
  const {
    currentMusicLevelKey,
    currentSongMusicDetail,
    setCurrentMusicLevelKey,
  } = usePlayerStore();

  const isUnlock = currentMusicLevelKey === "unlock";

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild={!!children}>
        {children ? (
          children
        ) : (
          <span
            className={cn(
              "cursor-pointer bg-card/50 hover:bg-card/30 rounded-md px-2 py-1 text-xs font-bold text-foreground/60 border",
              className,
            )}
          >
            {QUALITY_BY_KEY[currentMusicLevelKey].desc}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "w-64 rounded-lg bg-card/80 backdrop-blur-md",
          contentClassName,
        )}
      >
        {isUnlock ? (
          <div className="text-center">灰色音源歌曲不支持修改音质</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {currentSongMusicDetail.map((quality: SongQualityDetail) => (
              <AudioLevelItem
                key={quality.key}
                qualityKey={quality.key as QualityKey}
                size={formatFileSize(quality.size)}
                selected={quality.key === currentMusicLevelKey}
                onClick={setCurrentMusicLevelKey}
              />
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface AudioLevelItemProps {
  qualityKey: QualityKey;
  size?: string;
  selected?: boolean;
  onClick: (level: QualityKey) => void;
}

export function AudioLevelItem({
  qualityKey,
  size,
  selected = false,
  onClick,
}: AudioLevelItemProps) {
  const option = QUALITY_BY_KEY[qualityKey];

  return (
    <div
      className={cn(
        "relative flex justify-between items-center px-4 py-2 rounded-md cursor-pointer hover:bg-foreground/8",
        selected && "bg-foreground/5",
      )}
      onClick={() => onClick(qualityKey)}
    >
      <span className="font-semibold">{option.desc}</span>

      <div className="flex gap-2 items-center">
        {size && (
          <span className={cn("text-foreground/60 text-xs")}>{size}</span>
        )}
        {selected && (
          <span className="w-1 h-4 bg-primary absolute left-0 -translate-1/2 top-1/2 rounded-full"></span>
        )}
      </div>
    </div>
  );
}
