import { Playlist } from "@/lib/types";
import { PlaylistItem } from "./playlist-item";

export function PlaylistList({ playlistList }: { playlistList: Playlist[] }) {
  return (
    <div
      className="w-full grid gap-12"
      style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
    >
      {playlistList.map((playlist) => (
        <PlaylistItem playlist={playlist} key={playlist.id} />
      ))}
    </div>
  );
}
