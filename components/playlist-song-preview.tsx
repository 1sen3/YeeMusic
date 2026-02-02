import { Song } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Delete24Regular, Play24Filled } from "@fluentui/react-icons";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { LIKE_ICON } from "@/lib/constants/song";
import { likeSong } from "@/lib/services/user";
import { useUserStore } from "@/lib/store/userStore";
import { toast } from "sonner";
import { memo } from "react";
import { usePlayerStore } from "@/lib/store/playerStore";

export const PlaylistSongPreview = memo(
  function PlaylistSongPreview({
    song,
    isPlaying = false,
    isLike = false,
    titleStyle,
    artistStyle,
    coverStyle,
    textStyle,
    buttonStyle,
    showPlayingBadge = true,
  }: {
    song: Song;
    isPlaying: boolean;
    isLike: boolean;
    titleStyle?: string;
    artistStyle?: string;
    coverStyle?: string;
    textStyle?: string;
    buttonStyle?: string;
    showPlayingBadge?: boolean;
  }) {
    const { toggleLike } = useUserStore();
    const { playSong, removeFromPlaylist } = usePlayerStore();
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

    function handleRemove(e: React.MouseEvent) {
      e.preventDefault();

      removeFromPlaylist(song);
    }

    return (
      <div
        className={cn(
          "flex justify-between items-center rounded-md transition-all duration-200 ease-in-out group",
        )}
      >
        <div className="flex items-center gap-4 w-3/4 ">
          <div
            className="shrink-0 w-12 h-12 rounded-sm overflow-hidden relative group cursor-pointer"
            onClick={handlePlay}
          >
            <Image
              className={cn(
                " w-full h-full object-cover group-hover:brightness-50 transition-all duration-200 ease-out",
                coverStyle,
              )}
              src={song.al.picUrl || ""}
              alt={`${song.al.name}专辑封面`}
              fill
              loading="lazy"
            />

            <Play24Filled
              className={cn(
                "opacity-0 transition-opacity duration-200 ease-out text-white size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "group-hover:opacity-100",
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className={cn("line-clamp-1", titleStyle)}>{song.name}</p>
            <p className={cn("text-black/60 line-clamp-1", artistStyle)}>
              {song.ar.map((ar) => ar.name).join("、")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden group-hover:flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn("cursor-pointer", buttonStyle)}
              onClick={handleLike}
            >
              <LikeIcon
                className={cn("size-5", textStyle, isLike && "text-red-500")}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("cursor-pointer", buttonStyle)}
              onClick={handleRemove}
            >
              <Delete24Regular className={cn("size-5", textStyle)} />
            </Button>
          </div>

          <div className="flex items-center gap-2 group-hover:hidden">
            {showPlayingBadge && isPlaying && (
              <Badge variant="outline" className={textStyle}>
                播放中
              </Badge>
            )}
            <span className={textStyle}>{formatTime(song.dt / 1000)}</span>
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
