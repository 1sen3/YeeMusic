import { Song } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";
import {
  Delete24Regular,
  Pause24Filled,
  Play24Filled,
} from "@fluentui/react-icons";
import Image from "next/image";
import { LIKE_ICON } from "@/lib/constants/song";
import { likeSong } from "@/lib/services/user";
import { useUserStore } from "@/lib/store/userStore";
import { toast } from "sonner";
import { memo } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";
import Link from "next/link";
import { YeeButton } from "../yee-button";

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
    const { toggleLike } = useUserStore();
    const { playSong, removeFromPlaylist, togglePlay } = usePlayerStore();
    const isPlayerPlaying = usePlayerStore((s) => s.isPlaying);
    const LikeIcon = isLike ? LIKE_ICON.like : LIKE_ICON.unlike;

    async function handleLike(e: React.MouseEvent) {
      e.preventDefault();

      const targetLike = !isLike;
      toggleLike(song.id, targetLike);

      try {
        const res = await likeSong(song.id, targetLike);

        if (!res) {
          toggleLike(song.id, isLike);
          toast.error("操作失败，请稍后重试...", { position: "top-center" });
        }
      } catch (error) {
        toggleLike(song.id, isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
        console.log("切换歌曲喜欢状态失败", error);
      }
    }

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
      >
        <div className="flex items-center gap-4 w-3/4 ">
          <div
            className="shrink-0 w-12 h-12 rounded-sm shadow-sm overflow-hidden relative group cursor-pointer"
            onClick={isPlaying ? handlePause : handlePlay}
          >
            <Image
              className={cn(
                "w-full h-full object-cover group-hover:brightness-50 transition-all duration-200 ease-out",
                isPlaying && "brightness-50",
                coverStyle,
              )}
              src={song.al?.picUrl || ""}
              alt={`${song.al?.name}专辑封面`}
              fill
              loading="lazy"
            />

            <PlayButton
              className={cn(
                "transition-opacity duration-200 ease-out text-white size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
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
                  href={`/detail/artist/${ar.id}`}
                  key={`${song.id}-${ar.id}-${idx}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "text-sm text-black/60 hover:text-black/80",
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
              onClick={handleLike}
              icon={
                <LikeIcon
                  className={cn("size-5", textStyle, isLike && "text-red-500")}
                />
              }
              className={buttonStyle}
            />
            <YeeButton
              variant="ghost"
              onClick={handleRemove}
              icon={<Delete24Regular className={cn("size-5", textStyle)} />}
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
