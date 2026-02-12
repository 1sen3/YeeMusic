import { Song } from "@/lib/types";
import { useMemo } from "react";
import { PlaylistSongPreview } from "../playerbar/playlist-song-preview";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useUserStore } from "@/lib/store/userStore";
import { List } from "react-window";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { useScrollOverflowMask } from "@/hooks/use-scroll-overflow-mask";

interface RowProps {
  playlist: Song[];
  currentSong: Song | null;
  likeListSet: Set<number>;
  setOpen: (open: boolean) => void;
}

const RowComponent = ({
  index,
  style,
  ariaAttributes,
  playlist,
  currentSong,
  likeListSet,
  setOpen,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
} & RowProps) => {
  const song = playlist[index];

  if (!song) return null;

  return (
    <div style={style} {...ariaAttributes}>
      <PlaylistSongPreview
        setOpen={setOpen}
        song={song}
        isPlaying={song.id === currentSong?.id}
        isLike={likeListSet.has(song.id)}
        titleStyle="text-white/80 font-semibold mix-blend-plus-lighter"
        artistStyle="text-white/60 hover:text-white/40 mix-blend-plus-lighter"
        coverStyle="drop-shadow-md"
        textStyle="text-white/60 mix-blend-plus-lighter"
        buttonStyle="hover:bg-white/10"
        showPlayingBadge={false}
      />
      <Separator className="bg-white/10 mix-blend-plus-lighter mt-2.5" />
    </div>
  );
};

export function LyricSheetSonglist({
  className,
  setOpen,
}: {
  className?: string;
  setOpen: (open: boolean) => void;
}) {
  const { playlist, currentSong } = usePlayerStore();
  const { likeListSet } = useUserStore();

  const itemData = useMemo(
    () => ({
      playlist,
      currentSong,
      likeListSet,
      setOpen,
    }),
    [playlist, currentSong, likeListSet, setOpen],
  );

  const containerHeight = 560;
  const totalHeight = playlist.length * 72;

  const { handleScroll, maskImage } = useScrollOverflowMask(
    totalHeight,
    containerHeight,
  );

  return (
    <div className={cn("h-full w-full flex justify-center", className)}>
      <div className="h-full w-5/7 flex flex-col gap-4">
        <div className="flex flex-col">
          <span className="text-xl font-semibold text-white/60 mix-blend-overlay drop-shadow-md">
            继续播放
          </span>
        </div>

        <div
          className="flex-1 w-full relative"
          style={{
            height: 560,
            WebkitMaskImage: maskImage,
            maskImage: maskImage,
          }}
        >
          <List
            className="no-scrollbar"
            rowComponent={RowComponent}
            rowCount={playlist.length}
            rowHeight={72}
            rowProps={itemData}
            onScroll={handleScroll}
          />
        </div>
      </div>
    </div>
  );
}
