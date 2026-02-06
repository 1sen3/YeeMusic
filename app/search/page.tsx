"use client";

import { SongList } from "@/components/song-list/song-list";
import { Button } from "@/components/ui/button";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSearchResult, type SearchParams } from "@/lib/services/search";
import { Play24Filled } from "@fluentui/react-icons";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Song, Album, Artist, Playlist } from "@/lib/types";

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

  useEffect(() => {
    async function fetchData() {
      if (!query) return;
      try {
        const type = Number(tabValue) as SearchParams["type"];
        const res = await getSearchResult({ keywords: query, type });

        // 根据 type 更新对应的数据
        switch (type) {
          case 1:
            if (res.songs) setData((prev) => ({ ...prev, songs: res.songs! }));
            break;
          case 10:
            if (res.albums)
              setData((prev) => ({ ...prev, albums: res.albums! }));
            break;
          case 100:
            if (res.artists)
              setData((prev) => ({ ...prev, artists: res.artists! }));
            break;
          case 1000:
            if (res.playlists)
              setData((prev) => ({ ...prev, playlists: res.playlists! }));
            break;
        }
      } catch (err) {
        console.log(err);
      }
    }

    fetchData();
  }, [query, tabValue]);

  // 根据 tab 渲染不同内容
  const renderContent = () => {
    switch (tabValue) {
      case "1":
        return <SongList songList={data.songs} />;
      case "10":
        // TODO: 专辑列表组件
        return <div>专辑列表 ({data.albums.length})</div>;
      case "100":
        // TODO: 歌手列表组件
        return <div>歌手列表 ({data.artists.length})</div>;
      case "1000":
        // TODO: 歌单列表组件
        return <div>歌单列表 ({data.playlists.length})</div>;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-full px-8 py-8 flex flex-col gap-8">
      <div className="flex justify-between items-center shrink-0">
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

        <Button variant="outline" className="cursor-pointer">
          <Play24Filled className="size-4" />
          播放全部
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={<div className="w-full min-h-full px-8 py-8">加载中...</div>}
    >
      <SearchContent />
    </Suspense>
  );
}
