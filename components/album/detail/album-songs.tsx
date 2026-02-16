import { SongList } from "@/components/song/song-list";
import { Song } from "@/lib/types";

export function AlbumSongs({ songs }: { songs: Song[] }) {
  return (
    <div className="w-full h-full">
      {songs.length > 0 && (
        <SongList songList={songs} showCover={false} showAlbum={false} />
      )}
    </div>
  );
}
