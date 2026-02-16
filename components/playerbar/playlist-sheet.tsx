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
import { usePlayerStore } from "@/lib/store/playerStore";
import { PlaylistSongPreview } from "./playlist-song-preview";
import { useUserStore } from "@/lib/store/userStore";
import { List } from "react-window";
import { Song } from "@/lib/types/song";
import { useMemo, useState } from "react";
import { YeeButton } from "../yee-button";

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
        <YeeButton
          variant="ghost"
          icon={<TextBulletList24Regular className="size-6" />}
        />
      </SheetTrigger>
      <SheetContent
        className=" bg-background p-2 w-full"
        showCloseButton={false}
      >
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle>播放列表</SheetTitle>
            <div className="flex gap-2">
              <YeeButton
                variant="ghost"
                onClick={clearPlaylist}
                icon={<Delete24Regular />}
              />
              <YeeButton
                variant="ghost"
                onClick={() => setOpen(false)}
                icon={<Dismiss24Regular />}
              />
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
