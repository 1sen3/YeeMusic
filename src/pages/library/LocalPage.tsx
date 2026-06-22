import { BlurLayer } from "@/components/blur-layer";
import { Input } from "@/components/ui/input";
import { YeeButton } from "@/components/yee-button";
import { Popover, PopoverItem } from "@/components/yee-popover";
import { SongList } from "@/components/song/song-list";
import { LocalTrackToSong } from "@/lib/services/localMusic";
import { useLocalMusicStore } from "@/lib/store/localMusicStore/localMusicStore";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { SONG_SORT_OPTIONS } from "@/lib/constants/song";
import { cn } from "@/lib/utils";
import {
  ArrowSync24Regular,
  ChevronDown24Regular,
  Play24Filled,
  Search24Filled,
} from "@fluentui/react-icons";
import Pinyin from "pinyin-match";
import { useMemo, useState } from "react";

function matchesPinyin(text: string, query: string): boolean {
  const normalizedQuery = query.toLowerCase();
  return (
    text.toLowerCase().includes(normalizedQuery) || !!Pinyin.match(text, query)
  );
}

export default function LocalPage() {
  const localTracks = useLocalMusicStore((s) => s.tracks);
  const isScanning = useLocalMusicStore((s) => s.isScanning);
  const scanAll = useLocalMusicStore((s) => s.scanAll);
  const scanDirs = useLocalMusicStore((s) => s.scanDirs);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("date");

  const songs = useMemo(() => localTracks.map(LocalTrackToSong), [localTracks]);

  const visibleSongs = useMemo(() => {
    const query = searchQuery.trim();
    let result = [...songs];

    if (query) {
      result = result.filter(
        (song) =>
          matchesPinyin(song.name, query) ||
          (song.al?.name && matchesPinyin(song.al.name, query)) ||
          song.ar?.some((artist) => matchesPinyin(artist.name, query)),
      );
    }

    if (result.length === 0) return result;

    return [...result].sort((a, b) => {
      switch (sortOption) {
        case "name":
          return a.name.localeCompare(b.name, "zh-CN");
        case "artist":
          return (a.ar?.[0]?.name || "").localeCompare(
            b.ar?.[0]?.name || "",
            "zh-CN",
          );
        case "album":
          return (a.al?.name || "").localeCompare(b.al?.name || "", "zh-CN");
        case "duration":
          return (b.dt || 0) - (a.dt || 0);
        case "date":
        default:
          return 0;
      }
    });
  }, [searchQuery, songs, sortOption]);

  function handlePlayVisibleSongs() {
    if (visibleSongs.length === 0) return;
    void playQueue(visibleSongs);
  }

  const emptyText =
    songs.length > 0
      ? "没有找到匹配的本地歌曲"
      : scanDirs.length === 0
        ? "前往设置添加音乐文件夹"
        : "未找到音乐文件";

  return (
    <div className="w-full min-h-full px-0 pb-8 flex flex-col relative">
      <div
        className={cn(
          "flex gap-8 items-center shrink-0 sticky top-0 z-10 py-6 justify-between",
        )}
      >
        <div className="px-8 z-10 flex items-center gap-4">
          <YeeButton
            variant="outline"
            className="bg-primary! text-primary-foreground!"
            icon={<Play24Filled className="size-4" />}
            onClick={handlePlayVisibleSongs}
            disabled={visibleSongs.length === 0}
          />

          <YeeButton
            icon={
              <ArrowSync24Regular
                className={isScanning ? "animate-spin" : ""}
              />
            }
            variant="outline"
            onClick={scanAll}
            disabled={isScanning || scanDirs.length === 0}
            title={isScanning ? "扫描中..." : "重新扫描"}
          />
        </div>

        <BlurLayer />

        <div className="pr-8 z-10 flex items-center gap-4">
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
            {Object.entries(SONG_SORT_OPTIONS).map(([value, label]) => (
              <PopoverItem
                key={value}
                isActive={sortOption === value}
                onClick={() => setSortOption(value)}
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
              containerClassName="rounded-full drop-shadow-md drop-shadow-[0_10px_8px_rgba(0,0,0,0.1)]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false);
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 w-full h-full px-8">
        {visibleSongs.length === 0 && !isScanning ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <span className="text-sm">{emptyText}</span>
          </div>
        ) : (
          <SongList songList={visibleSongs} showCover={true} showAlbum={true} />
        )}
      </div>
    </div>
  );
}
