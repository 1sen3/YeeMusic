import {
  Delete24Regular,
  Dismiss24Regular,
  TextBulletList24Regular,
} from "@fluentui/react-icons";

import {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Sheet,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { usePlayerStore } from "@/lib/store/playerStore";
import { PlaylistSongPreview } from "./playlist-song-preview";
import { useUserStore } from "@/lib/store/userStore";
import { List } from "react-window";
import { Song } from "@/lib/types/song";
import { useMemo, useState } from "react";

interface RowProps {
  playlist: Song[];
  currentSong: Song | null;
  likeListSet: Set<number>;
}

const RowComponent = ({
  index,
  style,
  ariaAttributes,
  playlist,
  currentSong,
  likeListSet,
  setOpen,
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
} & RowProps & { setOpen: (open: boolean) => void }) => {
  const song = playlist[index];

  if (!song) return null;

  return (
    <div style={style} className="px-4" {...ariaAttributes}>
      <PlaylistSongPreview
        song={song}
        isPlaying={song.id === currentSong?.id}
        isLike={likeListSet.has(Number(song.id))}
        setOpen={setOpen}
      />
    </div>
  );
};

export function PlaylistSheet() {
  const { playlist, currentSong, clearPlaylist } = usePlayerStore();
  const { likeListSet } = useUserStore();
  const [open, setOpen] = useState(false);

  const itemData = useMemo(
    () => ({
      playlist,
      currentSong,
      likeListSet,
    }),
    [playlist, currentSong, likeListSet],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="cursor-pointer">
          <TextBulletList24Regular className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        className=" bg-background p-2 rounded-l-3xl w-full"
        showCloseButton={false}
      >
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle>播放列表</SheetTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="cursor-pointer rounded-full border"
                onClick={clearPlaylist}
              >
                <Delete24Regular />
                清空
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer border  rounded-full"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <Dismiss24Regular />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 w-full" style={{ height: 600 }}>
          <List
            rowComponent={RowComponent}
            rowCount={playlist.length}
            rowHeight={72}
            rowProps={{ ...itemData, setOpen }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
