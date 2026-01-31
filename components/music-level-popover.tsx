import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Badge } from "./ui/badge";
import { SONG_QUALITY } from "@/lib/constants/song";
import { cn, formatFileSize } from "@/lib/utils";
import { Checkmark24Filled } from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";

export function MusicLevelPopover() {
  const { musicLevel, currentSongMusicDetail, setMusicLevel } =
    usePlayerStore();

  const songMusicDetailList = Object.entries(currentSongMusicDetail || {})
    .map(([key, value]) => {
      const qualityKey = key as keyof typeof SONG_QUALITY;
      return {
        ...value,
        key: qualityKey,
      };
    })
    .sort((b, a) => a.size - b.size);

  function handleSetMusicLevel(level: string) {
    if (level in SONG_QUALITY) {
      setMusicLevel(level as keyof typeof SONG_QUALITY);
    }
  }

  return (
    <Popover>
      <PopoverTrigger>
        <Badge variant="outline" className="cursor-pointer hover:bg-black/10">
          {SONG_QUALITY[musicLevel].desc}
        </Badge>
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={48} className="w-64">
        <ul className="flex flex-col gap-2">
          {songMusicDetailList.map(
            (quality) =>
              quality.size &&
              SONG_QUALITY[quality.key] !== undefined && (
                <AudioLevelItem
                  key={quality.key}
                  level={quality.key}
                  size={formatFileSize(quality.size)}
                  selected={quality.key === musicLevel}
                  onClick={handleSetMusicLevel}
                />
              ),
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

interface AudioLevelItemProps {
  level: keyof typeof SONG_QUALITY;
  size: string;
  selected?: boolean;
  onClick: (level: string) => void;
}

export function AudioLevelItem({
  level,
  size,
  selected = false,
  onClick,
}: AudioLevelItemProps) {
  return (
    <div
      className="flex justify-between items-center hover:bg-black/5 px-2 py-2 rounded-md cursor-pointer"
      onClick={() => onClick(level)}
    >
      <Badge className={cn(SONG_QUALITY[level].color)}>
        {SONG_QUALITY[level].desc}
      </Badge>

      <div className="flex gap-2 items-center">
        <span className="text-black/60">{size}</span>
        {selected && <Checkmark24Filled className="w-5" />}
      </div>
    </div>
  );
}
