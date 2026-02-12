"use client";

import { SongList } from "@/components/song/song-list";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSearchResult, type SearchParams } from "@/lib/services/search";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Song, Album, Artist, Playlist } from "@/lib/types";
import { Loading } from "@/components/loading";
import { AlbumList } from "@/components/album/album-list";
import { ArtistList } from "@/components/artist/artist-list";
import { cn } from "@/lib/utils";
import { PlaylistList } from "@/components/playlist/playlist-list";

interface SearchData {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

function SearchContent() {
  const serchParams = useSearchParams();
  const query = serchParams.get("q");
  const [tabValue, setTabValue] = useState("1");
  const [data, setData] = useState<SearchData>({
    songs: [],
    albums: [],
    artists: [],
    playlists: [],
  });
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const LIMIT = 30;

  useEffect(() => {
    async function fetchData() {
      if (!query || loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);
      try {
        const type = Number(tabValue) as SearchParams["type"];
        const res = await getSearchResult({
          keywords: query,
          type,
          limit: LIMIT,
          offset,
        });

        // 根据 type 更新对应的数据
        switch (type) {
          case 1:
            if (res.songs)
              setData((prev) => ({
                ...prev,
                songs:
                  offset === 0 ? res.songs! : [...prev.songs, ...res.songs!],
              }));
            setHasMore(res.songs!.length >= LIMIT);
            break;
          case 10:
            if (res.albums)
              setData((prev) => ({
                ...prev,
                albums:
                  offset === 0 ? res.albums! : [...prev.albums, ...res.albums!],
              }));
            setHasMore(res.albums!.length >= LIMIT);
            break;
          case 100:
            if (res.artists)
              setData((prev) => ({
                ...prev,
                artists:
                  offset === 0
                    ? res.artists!
                    : [...prev.artists, ...res.artists!],
              }));
            setHasMore(res.artists!.length >= LIMIT);
            break;
          case 1000:
            if (res.playlists)
              setData((prev) => ({
                ...prev,
                playlists:
                  offset === 0
                    ? res.playlists!
                    : [...prev.playlists, ...res.playlists!],
              }));
            setHasMore(res.playlists!.length >= LIMIT);
            break;
        }
      } catch (err) {
        console.log(err);
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    }

    fetchData();
  }, [query, tabValue, offset]);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setData({ songs: [], albums: [], artists: [], playlists: [] });
  }, [query, tabValue]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setOffset((prev) => prev + LIMIT);
        }
      },
      { threshold: 0.1 },
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading]);

  const renderContent = () => {
    switch (tabValue) {
      case "1":
        return <SongList songList={data.songs} />;
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
    <div className="w-full min-h-full px-8 pb-8 flex flex-col relative">
      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
          "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[calc(100%)]",
          "before:bg-linear-to-b before:from-background before:via-background/80 before:to-transparent",
          "before:pointer-events-none before:-z-1",
        )}
      >
        <Tabs
          defaultValue={tabValue.toString()}
          value={tabValue}
          onValueChange={(v) => setTabValue(v)}
        >
          <TabsList>
            <TabsTrigger value="1">单曲</TabsTrigger>
            <TabsTrigger value="1000">歌单</TabsTrigger>
            <TabsTrigger value="100">歌手</TabsTrigger>
            <TabsTrigger value="10">专辑</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 w-full h-full">{renderContent()}</div>

      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {loading && <Loading />}
        {!hasMore && data.songs.length > 0 && (
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
