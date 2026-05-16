import { BlurLayer } from "@/components/blur-layer";
import { useLocalMusicStore } from "@/lib/store/localMusicStore/localMusicStore";
import { LocalTrackToSong } from "@/lib/services/localMusic";
import { SongListItem } from "@/components/song/song-list-item";
import { Virtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { ArrowSync24Regular } from "@fluentui/react-icons";
import { YeeButton } from "@/components/yee-button";

export default function LocalPage() {
  const localTracks = useLocalMusicStore((s) => s.tracks);
  const isScanning = useLocalMusicStore((s) => s.isScanning);
  const scanAll = useLocalMusicStore((s) => s.scanAll);
  const scanDirs = useLocalMusicStore((s) => s.scanDirs);

  // 缓存转换结果，只在 tracks 变化时重新计算
  const songs = useMemo(() => localTracks.map(LocalTrackToSong), [localTracks]);

  return (
    <div className="w-full min-h-full px-0 pb-8 flex flex-col relative">
      <div
        className={cn(
          "flex gap-8 items-center shrink-0 sticky top-0 z-10 py-6 justify-between",
        )}
      >
        <div className="px-8 z-10 flex items-center gap-4">
          <span className="text-sm font-semibold text-foreground/80">
            本地音乐相关功能尚在发开中，问题较多请见谅
          </span>
        </div>

        <BlurLayer />

        <div className="pr-8 z-10">
          <YeeButton
            icon={
              <ArrowSync24Regular
                className={isScanning ? "animate-spin" : ""}
              />
            }
            variant="outline"
            onClick={scanAll}
            disabled={isScanning || scanDirs.length === 0}
          >
            {isScanning ? "扫描中..." : "重新扫描"}
          </YeeButton>
        </div>
      </div>

      <div className="flex-1 w-full h-full px-8">
        {songs.length === 0 && !isScanning ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <span className="text-sm">
              {scanDirs.length === 0
                ? "前往设置添加音乐文件夹"
                : "未找到音乐文件"}
            </span>
          </div>
        ) : (
          <Virtuoso
            useWindowScroll
            customScrollParent={
              document.getElementById("main-scroll-container") as HTMLElement
            }
            data={songs}
            itemContent={(index, song) => (
              <div className="pb-4">
                <SongListItem
                  song={song}
                  index={index}
                  showCover={true}
                  showAlbum={true}
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
