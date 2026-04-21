import { Song } from "@/lib/types";
import { GetThumbnail, cn, formatDuration } from "@/lib/utils";
import {
  Delete24Regular,
  Pause24Filled,
  Play24Filled,
} from "@fluentui/react-icons";
import { LIKE_ICON } from "@/lib/constants/song";
import { memo } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Link } from "react-router-dom";
import { YeeButton } from "../yee-button";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { useSongLogic } from "@/hooks/use-song-logic";

export const PlaylistSongPreview = memo(
  function PlaylistSongPreview({
    setOpen,
    song,
    isPlaying = false,
    isLike = false,
    titleStyle,
    artistStyle,
    coverStyle,
    textStyle,
    buttonStyle,
  }: {
    setOpen: (open: boolean) => void;
    song: Song;
    isPlaying: boolean;
    isLike: boolean;
    titleStyle?: string;
    artistStyle?: string;
    coverStyle?: string;
    textStyle?: string;
    buttonStyle?: string;
  }) {
    const { playSong, removeFromPlaylist, togglePlay } = usePlayerStore();
    const isPlayerPlaying = usePlayerStore((s) => s.isPlaying);
    const LikeIcon = isLike ? LIKE_ICON.like : LIKE_ICON.unlike;
    const openMenu = useContextMenuStore((s) => s.openMenu);
    const { handleLike } = useSongLogic();

    function handlePlay(e: React.MouseEvent) {
      e.preventDefault();

      playSong(song);
    }

    function handlePause(e: React.MouseEvent) {
      e.preventDefault();

      togglePlay();
    }

    function handleRemove(e: React.MouseEvent) {
      e.preventDefault();

      removeFromPlaylist(song);
    }

    const PlayButton = isPlaying
      ? isPlayerPlaying
        ? Pause24Filled
        : Play24Filled
      : Play24Filled;

    return (
      <div
        className={cn(
          "flex justify-between items-center rounded-md transition-all duration-200 ease-in-out group",
        )}
        onContextMenu={(e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY, "song", song);
        }}
      >
        <div className="flex items-center gap-4 w-3/4 ">
          <div
            className="shrink-0 w-12 h-12 rounded-sm shadow-sm overflow-hidden relative group cursor-pointer"
            onClick={isPlaying ? handlePause : handlePlay}
          >
            <img
              className={cn(
                "w-full h-full object-cover group-hover:brightness-50 transition-all duration-200 ease-out",
                isPlaying && "brightness-50",
                coverStyle,
              )}
              src={GetThumbnail(song.al?.picUrl || song.album?.picUrl || "")}
              alt={`${song.al?.name}专辑封面`}
              loading="lazy"
            />

            <PlayButton
              className={cn(
                " transition-opacity duration-200 ease-out text-white size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                !isPlaying && "opacity-0  group-hover:opacity-100",
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <span
              className={cn("line-clamp-1 font-medium text-md", titleStyle)}
            >
              {song.name}
            </span>
            <div className="line-clamp-1">
              {song.ar.map((ar, idx) => (
                <Link
                  to={`/detail/artist/${ar.id}`}
                  key={`${song.id}-${ar.id}-${idx}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-sm text-foreground/60 hover:text-foreground/80",
                    artistStyle,
                  )}
                >
                  {ar.name}
                  {idx < song.ar.length - 1 && "、"}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden group-hover:flex gap-2 items-center">
            <YeeButton
              variant="ghost"
              onClick={() => handleLike("song", song.id)}
              icon={
                <LikeIcon
                  className={cn("size-4", textStyle, isLike && "text-red-500")}
                />
              }
              className={buttonStyle}
            />
            <YeeButton
              variant="ghost"
              onClick={handleRemove}
              icon={<Delete24Regular className={cn("size-4", textStyle)} />}
              className={buttonStyle}
            />
          </div>

          <div className="flex items-center gap-2 group-hover:hidden">
            <span className={textStyle}>
              {formatDuration((song.dt || 1) / 1000)}
            </span>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.isPlaying === next.isPlaying &&
      prev.isLike === next.isLike &&
      prev.song.id === next.song.id
    );
  },
);
