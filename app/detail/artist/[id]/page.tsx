"use client";

import { ArtistAlbum } from "@/components/artist/detail/artist-album";
import { ArtistDesc } from "@/components/artist/detail/artist-desc";
import { ArtistSimilar } from "@/components/artist/detail/artist-similar";
import { ArtistSong } from "@/components/artist/detail/artist-songs";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getArtistDetail } from "@/lib/services/artist";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Artist } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Heart24Filled,
  Play24Filled,
  Search24Regular,
} from "@fluentui/react-icons";
import Image from "next/image";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const [isLoading, setIsLoading] = useState(false);
  const { id } = use(params);
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tabValue, setTabValue] = useState("song");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const playArtist = usePlayerStore((s) => s.playArtist);

  useEffect(() => {
    async function fetchArtistDetail() {
      setIsLoading(true);
      try {
        const res = await getArtistDetail(id);
        setArtist(res);
        console.log("artist data:", res);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArtistDetail();
  }, [id]);

  const renderContent = (searchQuery?: string) => {
    switch (tabValue) {
      case "song":
        return <ArtistSong artistId={artist!.id} searchQuery={searchQuery} />;
      case "album":
        return <ArtistAlbum artistId={artist!.id} searchQuery={searchQuery} />;
      case "mv":
        return <div>开发中...</div>;
      case "desc":
        return <ArtistDesc artistId={artist!.id} />;
      case "similar":
        return <ArtistSimilar artistId={artist!.id} />;
    }
  };

  return (
    <div className="w-full min-h-screen px-8 py-8 flex flex-col">
      <DetailPageSkeleton loading={isLoading} data={artist}>
        {(artist) => (
          <>
            <div className="flex gap-8 items-center mb-8">
              <div className="w-44 h-44 flex-none relative rounded-full overflow-hidden bg-zinc-100 drop-shadow-xl">
                <Image
                  src={artist.avatar!}
                  alt={artist.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-semibold">{artist.name}</span>
                  <span className="text-black/60">{artist.alias?.[0]}</span>
                </div>
                <div className="flex gap-4">
                  <Button
                    className="rounded-full cursor-pointer border-0 drop-shadow-md"
                    variant="outline"
                    size="icon"
                    onClick={() => playArtist(artist.id.toString())}
                  >
                    <Play24Filled className="size-4" />
                  </Button>
                  <Button
                    className="rounded-full cursor-pointer border-0 drop-shadow-md"
                    variant="outline"
                    size="icon"
                  >
                    <Heart24Filled className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
                "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[calc(100%)]",
                "before:bg-linear-to-b before:from-background before:via-background/80 before:to-transparent",
                "before:pointer-events-none before:-z-1",
              )}
            >
              <Tabs value={tabValue} onValueChange={(v) => setTabValue(v)}>
                <TabsList>
                  <TabsTrigger value="song">歌曲</TabsTrigger>
                  <TabsTrigger value="album">专辑</TabsTrigger>
                  <TabsTrigger value="mv">MV</TabsTrigger>
                  <TabsTrigger value="desc">歌手详情</TabsTrigger>
                  <TabsTrigger value="similar">相似歌手</TabsTrigger>
                </TabsList>
              </Tabs>

              {["song", "album"].includes(tabValue) && (
                <div className="relative flex items-center">
                  <Search24Regular className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-black/60 pointer-events-none z-10" />
                  <Input
                    placeholder={searchOpen ? "搜索..." : ""}
                    className={cn(
                      "h-9 bg-white/90 rounded-full border-0 drop-shadow-md",
                      "focus:border-0 focus:ring-0!",
                      "transition-all duration-300 ease-in-out",
                      searchOpen ? "w-48 pl-8" : "w-9 cursor-pointer",
                    )}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 w-full h-full">
              {renderContent(searchQuery)}
            </div>
          </>
        )}
      </DetailPageSkeleton>
    </div>
  );
}

// 部署到 Cloudflare 前取消注释这行
// export const runtime = "edge";
