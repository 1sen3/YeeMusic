import { AlbumList } from "@/components/album/album-list";
import { Loading } from "@/components/loading";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { getArtistAlbums } from "@/lib/services/artist";
import { Album } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export function ArtistAlbum({
  artistId,
  searchQuery,
}: {
  artistId: string | number;
  searchQuery?: string;
}) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);

  const LIMIT = 30;

  useEffect(() => {
    async function fetchArtistAlbums() {
      setLoading(true);
      try {
        const res = await getArtistAlbums({
          id: artistId.toString(),
          limit: LIMIT,
          offset: offset,
        });
        setAlbums((prev) =>
          offset === 0 ? [...res.hotAlbums] : [...prev, ...res.hotAlbums],
        );
        setHasMore(res.more);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtistAlbums();
  }, [artistId, offset]);

  const loadMoreRef = useInfiniteScroll(
    () => setOffset((offset) => offset + LIMIT),
    { hasMore, loading },
  );

  const filteredAlbums = useMemo(() => {
    if (!searchQuery) return albums;
    const q = searchQuery.toLowerCase();
    return albums.filter((al) => al.name.toLowerCase().includes(q));
  }, [albums, searchQuery]);

  return (
    <div className="w-full h-full">
      {filteredAlbums.length > 0 && (
        <AlbumList
          albumList={filteredAlbums}
          showArtist={false}
          showDate={true}
        />
      )}
      <div ref={loadMoreRef} className="flex justify-center py-4">
        {loading && <Loading />}
        {!hasMore && albums.length > 0 && (
          <span className="text-black/60">没有更多了</span>
        )}
      </div>
    </div>
  );
}
