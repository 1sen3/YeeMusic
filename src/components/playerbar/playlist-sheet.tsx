import {
  Delete16Regular,
  Dismiss16Regular,
  TextBulletList16Regular,
} from "@fluentui/react-icons";

import {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Sheet,
} from "../ui/sheet";
import { usePlayerStore } from "@/lib/store/playerStore";
import { PlaylistSongPreview } from "./playlist-song-preview";
import { useUserStore } from "@/lib/store/userStore";
import { useMemo, useState } from "react";
import { YeeButton } from "../yee-button";
import { Virtuoso } from "react-virtuoso";

export function PlaylistSheet() {
  const playlist = usePlayerStore((s) => s.playlist);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const clearPlaylist = usePlayerStore((s) => s.clearPlaylist);

  const { likeListSet } = useUserStore();
  const [open, setOpen] = useState(false);

  const initialIndex = useMemo(
    () =>
      currentSong ? playlist.findIndex((s) => s.id === currentSong.id) : 0,
    [currentSong, playlist],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <YeeButton
          variant="ghost"
          icon={<TextBulletList16Regular className="size-4" />}
        />
      </SheetTrigger>
      <SheetContent
        className="bg-card/90 p-2 pr-0 w-full backdrop-blur-md drop-shadow-2xl"
        showCloseButton={false}
        container={document.getElementById("main-wrapper")}
      >
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle>播放列表</SheetTitle>
            <div className="flex gap-2">
              <YeeButton
                variant="ghost"
                onClick={clearPlaylist}
                icon={<Delete16Regular />}
              />
              <YeeButton
                variant="ghost"
                onClick={() => setOpen(false)}
                icon={<Dismiss16Regular />}
              />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 w-full -mt-8">
          <Virtuoso
            data={playlist}
            initialTopMostItemIndex={initialIndex !== -1 ? initialIndex : 0}
            itemContent={(_, song) => (
              <div className="px-4 py-4">
                <PlaylistSongPreview
                  song={song}
                  isPlaying={song.id === currentSong?.id}
                  isLike={likeListSet.has(Number(song.id))}
                  setOpen={setOpen}
                />
              </div>
            )}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
