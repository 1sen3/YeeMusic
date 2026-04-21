import { ArtistAlbum } from "@/components/artist/detail/artist-album";
import { ArtistDesc } from "@/components/artist/detail/artist-desc";
import { ArtistSimilar } from "@/components/artist/detail/artist-similar";
import { ArtistSong } from "@/components/artist/detail/artist-songs";
import { YeeButton } from "@/components/yee-button";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getArtistDetail } from "@/lib/services/artist";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Artist } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Heart24Filled,
  Heart24Regular,
  Play24Filled,
  Search24Regular,
} from "@fluentui/react-icons";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loading } from "@/components/loading";
import { useUserStore } from "@/lib/store/userStore";
import { subArtist } from "@/lib/services/user";
import { toast } from "sonner";
import { BlurLayer } from "@/components/blur-layer";

function ArtistContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tabValue, setTabValue] = useState("song");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const playArtist = usePlayerStore((s) => s.playArtist);

  const artistListSet = useUserStore((s) => s.artistListSet);
  const toggleLikeArtist = useUserStore((s) => s.toggleLikeArtist);
  const isLike = artistListSet.has(Number(id));
  const likeIcon = isLike ? (
    <Heart24Filled className="size-4 text-red-500" />
  ) : (
    <Heart24Regular className="size-4" />
  );

  useEffect(() => {
    async function fetchArtistDetail() {
      setIsLoading(true);
      if (!id) return;
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

  async function toggleLike() {
    const targetLike = !isLike;

    toggleLikeArtist(artist!, targetLike);

    try {
      const res = await subArtist(id!, targetLike ? 1 : 2);

      if (!res) {
        toggleLikeArtist(artist!, isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
      }
    } catch (err) {
      toggleLikeArtist(artist!, isLike);
      toast.error("操作失败，请稍后重试...", { position: "top-center" });
    }
  }

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

  if (!id) return <div className="p-8">未找到歌手</div>;

  return (
    <div className="w-full min-h-screen py-8 flex flex-col">
      <DetailPageSkeleton loading={isLoading} data={artist}>
        {(artist) => (
          <>
            <div className="flex gap-8 items-center mb-8 px-8">
              <div className="w-44 h-44 flex-none relative rounded-full overflow-hidden bg-zinc-100 drop-shadow-xl">
                <img
                  src={artist.avatar!}
                  alt={artist.name}
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <span className="text-2xl font-semibold">{artist.name}</span>
                  <span className="text-foreground/60">
                    {artist.alias?.[0]}
                  </span>
                </div>
                <div className="flex gap-4">
                  <YeeButton
                    variant="outline"
                    className="bg-card"
                    onClick={() => playArtist(artist.id.toString())}
                    icon={<Play24Filled className="size-4" />}
                  />
                  <YeeButton
                    variant="outline"
                    className="bg-card"
                    icon={likeIcon}
                    onClick={toggleLike}
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(
                "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
              )}
            >
              <div className="px-8 z-10">
                <Tabs value={tabValue} onValueChange={(v) => setTabValue(v)}>
                  <TabsList>
                    <TabsTrigger value="song">歌曲</TabsTrigger>
                    <TabsTrigger value="album">专辑</TabsTrigger>
                    <TabsTrigger value="mv">MV</TabsTrigger>
                    <TabsTrigger value="desc">歌手详情</TabsTrigger>
                    <TabsTrigger value="similar">相似歌手</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <BlurLayer />

              {["song", "album"].includes(tabValue) && (
                <div className="relative flex items-center pr-8">
                  <Search24Regular className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2  text-foreground/80 pointer-events-none z-10" />
                  <Input
                    placeholder={searchOpen ? "搜索..." : ""}
                    className={cn(
                      "h-9 bg-card rounded-full border-0",
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
                    containerClassName="rounded-full drop-shadow-md"
                    showIndicator={false}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 w-full h-full px-8">
              {renderContent(searchQuery)}
            </div>
          </>
        )}
      </DetailPageSkeleton>
    </div>
  );
}

export default function ArtistDetailPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Loading />
        </div>
      }
    >
      <ArtistContent />
    </Suspense>
  );
}
