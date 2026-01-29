import { Song } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { Delete24Regular, Play24Filled } from "@fluentui/react-icons";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Button } from "./ui/button";
import { LIKE_ICON } from "@/lib/constants/song";

export function PlaylistSongPreview({
  song,
  isPlaying = false,
  isLike = false,
}: {
  song: Song;
  isPlaying: boolean;
  isLike: boolean;
}) {
  const LikeIcon = isLike ? LIKE_ICON.like : LIKE_ICON.unlike;

  return (
    <div
      className={cn(
        "flex justify-between items-center rounded-md trnasition-all duration-200 ease-in-out group",
      )}
    >
      <div className="flex items-center gap-4 w-3/4 ">
        <div className="shrink-0 w-12 h-12 border border-black-60 rounded-sm overflow-hidden relative group cursor-pointer">
          <Image
            className=" w-full h-full object-cover group-hover:brightness-50 transition-all duration-200 ease-out"
            src={song.al.picUrl}
            alt={`${song.al.name}专辑封面`}
            width={48}
            height={48}
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
          <p className="line-clamp-1">{song.name}</p>
          <p className="text-black/60 line-clamp-1">
            {song.ar.map((ar) => ar.name).join("、")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden group-hover:flex gap-2 items-center">
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <LikeIcon className={cn("size-5", isLike && "text-red-500")} />
          </Button>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <Delete24Regular className="size-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 group-hover:hidden">
          {isPlaying && <Badge variant="outline">播放中</Badge>}
          <span>{formatTime(song.dt / 1000)}</span>
        </div>
      </div>
    </div>
  );
}
