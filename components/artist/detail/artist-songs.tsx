import { Loading } from "@/components/loading";
import { SongList } from "@/components/song/song-list";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getArtistAllSongs } from "@/lib/services/artist";
import { Song } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export function ArtistSong({
  artistId,
  searchQuery,
}: {
  artistId: number | string;
  searchQuery?: string;
}) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);

  const LIMIT = 50;

  useEffect(() => {
    async function fetchArtistSongs() {
      setLoading(true);
      try {
        const res = await getArtistAllSongs({
          id: artistId.toString(),
          limit: LIMIT,
          offset: offset,
        });
        setSongs((prev) =>
          offset === 0
            ? [...res.songDetails!.songs]
            : [...prev, ...res.songDetails!.songs],
        );
        setHasMore(res.more);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtistSongs();
  }, [artistId, offset]);

  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.ar?.some((a) => a.name.toLowerCase().includes(q)) ||
        s.al?.name.toLowerCase().includes(q),
    );
  }, [songs, searchQuery]);

  const loadMoreRef = useInfiniteScroll(
    () => setOffset((prev) => prev + LIMIT),
    { hasMore, loading },
  );

  return (
    <div className="w-full h-full">
      {filteredSongs.length > 0 && <SongList songList={filteredSongs} />}

      <div ref={loadMoreRef} className="flex justify-center py-4">
        {loading && <Loading />}
        {!hasMore && songs.length > 0 && (
          <span className="text-black/60">没有更多了</span>
        )}
      </div>
    </div>
  );
}
