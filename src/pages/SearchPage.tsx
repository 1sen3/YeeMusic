import { SongList } from "@/components/song/song-list";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSearchResult, type SearchParams } from "@/lib/services/search";
import { useSearchParams } from "react-router-dom";
import { Suspense, useEffect, useRef, useState } from "react";
import { Song, Album, Artist, Playlist } from "@/lib/types";
import { Loading } from "@/components/loading";
import { AlbumList } from "@/components/album/album-list";
import { ArtistList } from "@/components/artist/artist-list";
import { cn } from "@/lib/utils";
import { PlaylistList } from "@/components/playlist/playlist-list";
import { BlurLayer } from "@/components/blur-layer";

interface SearchData {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

type SearchResult = {
  songs?: Song[];
  songCount?: number;
  albums?: Album[];
  albumCount?: number;
  artists?: Artist[];
  artistCount?: number;
  playlists?: Playlist[];
  playlistCount?: number;
};

const LIMIT = 30;

const EMPTY_DATA: SearchData = {
  songs: [],
  albums: [],
  artists: [],
  playlists: [],
};

function SearchContent() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [tabValue, setTabValue] = useState("1");
  const [data, setData] = useState<SearchData>(EMPTY_DATA);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const type = Number(tabValue) as SearchParams["type"];

  const currentLength =
    {
      "1": data.songs.length,
      "10": data.albums.length,
      "100": data.artists.length,
      "1000": data.playlists.length,
    }[tabValue] ?? 0;

  // query / tab 变化时，先重置
  useEffect(() => {
    setData(EMPTY_DATA);
    setOffset(0);
    setHasMore(true);
    abortRef.current?.abort();
  }, [query, tabValue]);

  useEffect(() => {
    if (!query) {
      setData(EMPTY_DATA);
      setHasMore(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    async function fetchData() {
      setLoading(true);

      try {
        const res: SearchResult = await getSearchResult(
          {
            keywords: query,
            type,
            limit: LIMIT,
            offset,
          },
          { signal: controller.signal },
        );

        switch (type) {
          case 1: {
            const songs = res.songs ?? [];
            const total = res.songCount ?? 0;

            setData((prev) => ({
              ...prev,
              songs: offset === 0 ? songs : [...prev.songs, ...songs],
            }));

            setHasMore(offset + songs.length < total);
            break;
          }

          case 10: {
            const albums = res.albums ?? [];
            const total = res.albumCount ?? 0;

            setData((prev) => ({
              ...prev,
              albums: offset === 0 ? albums : [...prev.albums, ...albums],
            }));

            setHasMore(offset + albums.length < total);
            break;
          }

          case 100: {
            const artists = res.artists ?? [];
            const total = res.artistCount ?? 0;

            setData((prev) => ({
              ...prev,
              artists: offset === 0 ? artists : [...prev.artists, ...artists],
            }));

            setHasMore(offset + artists.length < total);
            break;
          }

          case 1000: {
            const playlists = res.playlists ?? [];
            const total = res.playlistCount ?? 0;

            setData((prev) => ({
              ...prev,
              playlists:
                offset === 0 ? playlists : [...prev.playlists, ...playlists],
            }));

            setHasMore(offset + playlists.length < total);
            break;
          }

          default:
            setHasMore(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error(err);
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      controller.abort();
    };
  }, [query, type, offset]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !loading) {
          setOffset((prev) => prev + LIMIT);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading]);

  const renderContent = () => {
    switch (tabValue) {
      case "1":
        return <SongList songList={data.songs} showAlbum={true} />;
      case "10":
        return <AlbumList albumList={data.albums} />;
      case "100":
        return <ArtistList artistList={data.artists} />;
      case "1000":
        return <PlaylistList playlistList={data.playlists} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col gap-2 py-8">
      <div
        className={cn(
          "relative mt-4 mb-2 text-4xl font-bold",
          "before:text-5xl before:text-muted-foreground/60 before:content-['“']",
          "after:text-5xl after:text-muted-foreground/60 after:content-['”']",
          "z-10 px-8",
        )}
      >
        {query}
      </div>

      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between py-6 ">
        <div className="z-10 px-8">
          <Tabs value={tabValue} onValueChange={setTabValue}>
            <TabsList>
              <TabsTrigger value="1">单曲</TabsTrigger>
              <TabsTrigger value="1000">歌单</TabsTrigger>
              <TabsTrigger value="100">歌手</TabsTrigger>
              <TabsTrigger value="10">专辑</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <BlurLayer />
      </div>

      <div className="h-full w-full flex-1 px-8">{renderContent()}</div>

      <div ref={loadMoreRef} className="flex justify-center mt-8">
        {loading && <Loading />}
        {!loading && !hasMore && currentLength > 0 && (
          <span className="text-black/60">没有更多了</span>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchContent />
    </Suspense>
  );
}
