import { Song } from "@/lib/types";
import { SongListItem } from "./song-list-item";

export function SongList({
  songList,
  showCover = true,
  showAlbum = false,
}: {
  songList: Song[];
  showCover?: boolean;
  showAlbum?: boolean;
}) {
  return (
    <div className="flex-1 flex flex-col gap-4">
      {songList.map((song, index) => {
        return (
          <SongListItem
            key={song.id}
            song={song}
            index={index}
            showCover={showCover}
            showAlbum={showAlbum}
          />
        );
      })}
    </div>
  );
}
