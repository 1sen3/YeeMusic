import { Song } from "@/lib/types";
import { SongListItem } from "./song-list-item";
import { Separator } from "../ui/separator";

export function SongList({ songList }: { songList: Song[] }) {
  return (
    <div className="flex-1 flex flex-col gap-2">
      {songList.map((song, index) => {
        return (
          <>
            <Separator />
            <SongListItem key={song.id} song={song} index={index} />
          </>
        );
      })}
    </div>
  );
}
