import { SongList } from "@/components/song/song-list";
import { Song } from "@/lib/types";
import { CollectionsEmpty24Regular } from "@fluentui/react-icons";
import { useMemo } from "react";

export function PlaylistSongs({
  songs,
  query,
  sort,
}: {
  songs: Song[];
  query: string;
  sort?: string;
}) {
  const filteredAndSortedSongs = useMemo(() => {
    let result = [...songs];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.al?.name.toLowerCase().includes(q) ||
          s.ar?.some((a) => a.name.toLowerCase().includes(q)),
      );
    }

    if (!sort || result.length === 0) return result;

    return [...result].sort((a, b) => {
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name, "zh-CN");
        case "artist":
          const artistA = a.ar?.[0]?.name || "";
          const artistB = b.ar?.[0]?.name || "";
          return artistA.localeCompare(artistB, "zh-CN");

        case "album":
          const albumA = a.al?.name || "";
          const albumB = b.al?.name || "";
          return albumA.localeCompare(albumB, "zh-CN");

        case "duration":
          const dtA = a.dt || 0;
          const dtB = b.dt || 0;
          return dtB - dtA;

        case "date":
          return 0;

        default:
          return 0;
      }
    });
  }, [songs, query, sort]);

  return (
    <div className="w-full h-full">
      {songs && <SongList songList={filteredAndSortedSongs} showAlbum={true} />}
      {!songs.length && (
        <div className="h-64 text-black/60 flex items-center justify-center gap-4">
          <CollectionsEmpty24Regular /> 暂无歌曲
        </div>
      )}
    </div>
  );
}
