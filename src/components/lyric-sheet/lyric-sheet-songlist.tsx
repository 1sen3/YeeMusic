import { PlaylistSongPreview } from "../playerbar/playlist-song-preview";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useUserStore } from "@/lib/store/userStore";
import { cn } from "@/lib/utils";
import { useScrollOverflowMask } from "@/hooks/use-scroll-overflow-mask";
import { Virtuoso } from "react-virtuoso";
import { useMemo } from "react";

export function LyricSheetSonglist({
  className,
  setOpen,
}: {
  className?: string;
  setOpen: (open: boolean) => void;
}) {
  const { playlist, currentSong } = usePlayerStore();
  const { likeListSet } = useUserStore();

  const { handleScroll, maskImage } = useScrollOverflowMask();

  const initialIndex = useMemo(() => {
    if (!currentSong || playlist.length === 0) return 0;
    const nowIndex = playlist.findIndex((s) => s.id === currentSong.id);
    return Math.max(0, nowIndex - 1);
  }, [currentSong, playlist]);

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
          <Virtuoso
            className="no-scrollbar"
            onScroll={handleScroll}
            initialTopMostItemIndex={initialIndex}
            data={playlist}
            itemContent={(_, song) => (
              <div className="py-4">
                <PlaylistSongPreview
                  song={song}
                  isPlaying={currentSong ? song.id === currentSong.id : false}
                  isLike={likeListSet.has(Number(song.id))}
                  setOpen={setOpen}
                  titleStyle="text-white/80 font-semibold mix-blend-plus-lighter"
                  artistStyle="text-white/60 hover:text-white/40 mix-blend-plus-lighter"
                  coverStyle="drop-shadow-md"
                  textStyle="text-white/60 mix-blend-plus-lighter"
                  buttonStyle="text-white hover:bg-black/10"
                />
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
