import { Song } from "@/lib/types";
import { SongListItem } from "./song-list-item";

export function SongList({ songList }: { songList: Song[] }) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {songList.map((song, index) => {
        return <SongListItem key={song.id} song={song} index={index} />;
      })}
    </div>
  );
}
