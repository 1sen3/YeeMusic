import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPlaylistAllTrack } from "@/lib/services/playlist";
import { useUserStore } from "@/lib/store/userStore";
import { Playlist, Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Heart24Filled,
  Play24Filled,
  Search24Regular,
} from "@fluentui/react-icons";
import Image from "next/image";
import { useState } from "react";
import { PlaylistSongs } from "./playlist-songs";

export function PlaylistPage({ playlist }: { playlist: Playlist }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const user = useUserStore((s) => s.user);
  const title =
    playlist.creator.userId === user?.userId && playlist.specialType === 5
      ? "我喜欢的音乐"
      : playlist.name;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-8 items-center mb-8">
        <div className="w-44 h-44 flex-none relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
          <Image
            src={playlist.coverImgUrl!}
            alt={playlist.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-2xl font-semibold">{title}</span>
            <div className="flex gap-2 items-center">
              <Avatar className="size-6 drop-shadow-md">
                <AvatarImage src={playlist.creator.avatarUrl} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="text-black/80">{playlist.creator.nickname}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              className="rounded-full cursor-pointer border-0 drop-shadow-md"
              variant="outline"
              size="icon"
              // onClick={() => playList(id, "album")}
            >
              <Play24Filled className="size-4" />
            </Button>
            <Button
              className="rounded-full cursor-pointer border-0 drop-shadow-md"
              variant="outline"
              size="icon"
            >
              <Heart24Filled className="size-4 text-red-500" />
            </Button>
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

      <PlaylistSongs playlistId={playlist.id} query={searchQuery} />
    </div>
  );
}
