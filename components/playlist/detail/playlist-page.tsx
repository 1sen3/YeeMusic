import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Playlist } from "@/lib/types";
import { cn, formateDate } from "@/lib/utils";
import {
  Heart24Filled,
  Play24Filled,
  Search24Regular,
} from "@fluentui/react-icons";
import Image from "next/image";
import { useState } from "react";
import { PlaylistSongs } from "./playlist-songs";
import { usePlayerStore } from "@/lib/store/playerStore";
import { YeeButton } from "@/components/yee-button";

export function PlaylistPage({
  playlist,
  isMyPlaylist,
}: {
  playlist: Playlist;
  isMyPlaylist: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const playList = usePlayerStore((s) => s.playList);

  const playlistId = playlist.id;
  const title =
    isMyPlaylist && playlist.specialType === 5 ? "我喜欢的音乐" : playlist.name;
  const coverImgUrl = playlist.coverImgUrl;

  const creatorName = playlist.creator.nickname;
  const creatorAvatarUrl = playlist.creator.avatarUrl;
  const createTime = playlist.createTime;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-8 items-center mb-8">
        <div className="w-44 h-44 flex-none relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
          <Image
            src={coverImgUrl}
            alt={`${title} 封面`}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-6">
          <span className="text-2xl font-semibold">{title}</span>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <Avatar className="size-6 drop-shadow-md">
                <AvatarImage src={creatorAvatarUrl} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="text-black/80">{creatorName}</span>
            </div>
            <span className="text-black/60 text-sm">
              创建于 {formateDate(createTime)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
          "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[calc(100%)]",
          "before:bg-linear-to-b before:from-background before:via-background/80 before:to-transparent",
          "before:pointer-events-none before:-z-1",
        )}
      >
        <div className="flex gap-4">
          <YeeButton
            variant="outline"
            onClick={() => playList(playlistId, "list")}
            icon={<Play24Filled className="size-4" />}
          />
          {!isMyPlaylist && (
            <YeeButton
              variant="outline"
              icon={<Heart24Filled className="size-4 text-red-500" />}
            />
          )}
        </div>

        <div className="relative flex items-center">
          <Search24Regular className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none z-10" />
          <Input
            placeholder={searchOpen ? "搜索..." : ""}
            className={cn(
              "h-9 bg-white/90 rounded-full border-0 drop-shadow-md",
              "focus:border-0 focus:ring-0!",
              "transition-all duration-300 ease-in-out",
              searchOpen ? "w-48 pl-8" : "w-9 cursor-pointer",
            )}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => {
              if (!searchQuery) setSearchOpen(false);
            }}
          />
        </div>
      </div>

      <PlaylistSongs playlistId={playlistId} query={searchQuery} />
    </div>
  );
}
