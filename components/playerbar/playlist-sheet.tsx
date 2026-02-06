import { NavigationPlay20Regular } from "@fluentui/react-icons";
import { MyTooltip } from "../my-tooltip";
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
import { useMemo } from "react";

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
}: {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
} & RowProps) => {
  const song = playlist[index];

  if (!song) return null;

  return (
    <div style={style} className="px-4" {...ariaAttributes}>
      <PlaylistSongPreview
        song={song}
        isPlaying={song.id === currentSong?.id}
        isLike={likeListSet.has(Number(song.id))}
      />
    </div>
  );
};

export function PlaylistSheet() {
  const { playlist, currentSong } = usePlayerStore();
  const { likeListSet } = useUserStore();

  const itemData = useMemo(
    () => ({
      playlist,
      currentSong,
      likeListSet,
    }),
    [playlist, currentSong, likeListSet],
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-12 cursor-pointer">
          <NavigationPlay20Regular className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className=" bg-white/90 backdrop-blur-md px-2 py-2">
        <SheetHeader>
          <SheetTitle>播放列表</SheetTitle>
        </SheetHeader>

        <div className="flex-1 w-full" style={{ height: 600 }}>
          <List
            rowComponent={RowComponent}
            rowCount={playlist.length}
            rowHeight={72}
            rowProps={itemData}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
