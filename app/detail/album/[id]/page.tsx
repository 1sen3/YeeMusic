"use client";

import { AlbumDesc } from "@/components/album/detail/album-desc";
import { AlbumSongs } from "@/components/album/detail/album-songs";
import { YeeButton } from "@/components/yee-button";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAlbum } from "@/lib/services/album";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Album } from "@/lib/types";
import { cn, formateDate } from "@/lib/utils";
import { Heart24Filled, Play24Filled } from "@fluentui/react-icons";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(false);
  const [album, setAlbum] = useState<Album | null>(null);
  const [tabValue, setTabValue] = useState("song");
  const playList = usePlayerStore((s) => s.playList);

  useEffect(() => {
    async function fetchAlbumDetail() {
      setLoading(true);
      try {
        const res = await getAlbum(id);
        setAlbum(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAlbumDetail();
  }, [id]);

  const renderContent = () => {
    switch (tabValue) {
      case "song":
        return <AlbumSongs songs={album!.songs!} />;
      case "comment":
        return <div>开发中...</div>;
      case "desc":
        return <AlbumDesc desc={album!.description!} />;
    }
  };

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col">
      <DetailPageSkeleton loading={loading} data={album}>
        {(album) => (
          <>
            <div className="flex gap-8 items-center mb-8">
              <div className="w-44 h-44 flex-none relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
                <Image
                  src={album.picUrl!}
                  alt={album.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col gap-6">
                <span className="text-2xl font-semibold">{album.name}</span>
                <div className="flex flex-col gap-2">
                  <div>
                    {album.artists!.map((ar, index) => (
                      <Link
                        key={`${ar.id}`}
                        href={`/detail/artist/${ar.id}`}
                        className="text-black/60 hover:text-black/80 text-md font-medium"
                      >
                        {ar.name}
                        {index !== album.artists!.length - 1 && "、"}
                      </Link>
                    ))}
                  </div>
                  <span className="text-black/60 text-sm">
                    发布于 {formateDate(album.publishTime!)}
                  </span>
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
                  <TabsTrigger value="comment">评论</TabsTrigger>
                  <TabsTrigger value="desc">专辑详情</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex gap-4">
                <YeeButton
                  variant="outline"
                  onClick={() => playList(id, "album")}
                  icon={<Play24Filled className="size-4" />}
                />
                <YeeButton
                  variant="outline"
                  icon={<Heart24Filled className="size-4 text-red-500" />}
                />
              </div>
            </div>

            <div className="flex-1 w-full h-full">{renderContent()}</div>
          </>
        )}
      </DetailPageSkeleton>
    </div>
  );
}

// export const runtime = "edge";
