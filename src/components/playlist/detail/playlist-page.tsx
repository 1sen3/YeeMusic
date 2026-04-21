import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Playlist, Song } from "@/lib/types";
import { cn, formateDate } from "@/lib/utils";
import {
  ChevronDown24Regular,
  Heart24Filled,
  Heart24Regular,
  LockClosed24Filled,
  Play24Filled,
  Search24Filled,
} from "@fluentui/react-icons";
import { useState } from "react";
import { PlaylistSongs } from "./playlist-songs";
import { usePlayerStore } from "@/lib/store/playerStore";
import { YeeButton } from "@/components/yee-button";
import { useUserStore } from "@/lib/store/userStore";
import { subscribePlaylist } from "@/lib/services/playlist";
import { toast } from "sonner";
import { PlaylistEditButton } from "../playlist-edit-button";
import { PlaylistDeleteButton } from "../playlist-delete-button";
import { BlurLayer } from "@/components/blur-layer";
import { Popover, PopoverItem } from "@/components/yee-popover";
import { SONG_SORT_OPTIONS } from "@/lib/constants/song";

export function PlaylistPage({
  playlist,
  songs,
  isMyPlaylist,
  onRefresh,
}: {
  playlist: Playlist;
  songs: Song[];
  isMyPlaylist: boolean;
  onRefresh?: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const playList = usePlayerStore((s) => s.playList);

  const playlistId = playlist.id;
  const isFavList = isMyPlaylist && playlist.specialType === 5;
  const title = isFavList ? "我喜欢的音乐" : playlist.name;
  const coverImgUrl = playlist.coverImgUrl;

  const creatorName = playlist.creator.nickname;
  const creatorAvatarUrl = playlist.creator.avatarUrl;
  const createTime = playlist.createTime;

  const toggleLikePlaylist = useUserStore((s) => s.toggleLikePlaylist);
  const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);
  const isSubscribed = subscribedPlaylists.some((pl) => pl.id === playlist.id);
  const LikeIcon = isSubscribed ? Heart24Filled : Heart24Regular;

  const isPrivacy = playlist.privacy === 10;

  async function handleLike() {
    const targetState = !isSubscribed;
    toggleLikePlaylist(playlist, targetState);
    try {
      const res = await subscribePlaylist(targetState ? 1 : 2, playlistId);
      if (!res) {
        toggleLikePlaylist(playlist, isSubscribed);
        toast.error("操作失败，请重试", { position: "top-center" });
      }
    } catch (err) {
      console.error("切换歌单喜欢状态失败", err);
      toggleLikePlaylist(playlist, isSubscribed);
      toast.error("操作失败，请重试", { position: "top-center" });
    }
  }

  const [sortOption, setSortOption] = useState("date");

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex gap-8 items-center mb-8 px-8">
        <div className="w-44 h-44 flex-none relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
          <img
            src={coverImgUrl}
            alt={`${title} 封面`}
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-6">
          <span className="text-2xl font-semibold flex gap-2 items-center">
            {title}
            {isPrivacy && (
              <LockClosed24Filled className="size-6 text-black/40" />
            )}
          </span>
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <Avatar className="size-6 drop-shadow-md">
                <AvatarImage src={creatorAvatarUrl} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span className="text-foreground/80">{creatorName}</span>
            </div>
            <span className="text-foreground/60 text-sm">
              创建于 {formateDate(createTime)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
        )}
      >
        <div className="flex gap-4 z-10 pl-8">
          <YeeButton
            variant="outline"
            className="bg-primary! text-primary-foreground!"
            onClick={() => playList(playlistId, "list")}
            disabled={playlist.trackCount === 0}
            icon={<Play24Filled className="size-4" />}
          />
          {isMyPlaylist && !isFavList && (
            <>
              <PlaylistEditButton playlist={playlist} onSuccess={onRefresh} />
              <PlaylistDeleteButton playlist={playlist} />
            </>
          )}
          {!isMyPlaylist && (
            <YeeButton
              variant="outline"
              icon={
                <LikeIcon
                  className={cn("size-4", isSubscribed && "text-red-500")}
                />
              }
              onClick={handleLike}
            />
          )}
        </div>
        <div className="flex gap-4 items-center z-10 pr-8">
          <Popover
            trigger={
              <div className="flex gap-2 items-center hover:bg-foreground/5 px-4 py-2 rounded-sm cursor-pointer">
                <span className="text-sm font-light">排序方式：</span>
                <span className="text-sm font-semibold text-primary">
                  {SONG_SORT_OPTIONS[sortOption]}
                </span>
                <ChevronDown24Regular className="size-4 text-foreground/60" />
              </div>
            }
          >
            {Object.entries(SONG_SORT_OPTIONS).map(([val, label]) => (
              <PopoverItem
                key={val}
                isActive={sortOption === val}
                onClick={() => setSortOption(val)}
              >
                {label}
              </PopoverItem>
            ))}
          </Popover>

          <div className="relative flex items-center">
            <Search24Filled className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/60 pointer-events-none z-10" />
            <Input
              showIndicator={false}
              placeholder={searchOpen ? "搜索..." : ""}
              className={cn(
                "h-9 bg-card! rounded-full border-0",
                "focus:border-0 focus:ring-0!",
                "transition-all duration-300 ease-in-out",
                searchOpen ? "w-48 pl-8" : "w-9 cursor-pointer",
              )}
              containerClassName="rounded-full drop-shadow-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
            />
          </div>
        </div>

        <BlurLayer />
      </div>

      <div className="px-8">
        <PlaylistSongs songs={songs} query={searchQuery} sort={sortOption} />
      </div>
    </div>
  );
}
