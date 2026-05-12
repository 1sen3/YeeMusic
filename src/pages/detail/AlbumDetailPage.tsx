import { AlbumDesc } from "@/components/album/detail/album-desc";
import { AlbumSongs } from "@/components/album/detail/album-songs";
import { YeeButton } from "@/components/yee-button";
import { AlbumSkeleton } from "@/components/skeleton/album-skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAlbum } from "@/lib/services/album";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { Album } from "@/lib/types";
import { cn, formateDate } from "@/lib/utils";
import {
  Heart24Filled,
  Heart24Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { subAlbum } from "@/lib/services/user";
import { toast } from "sonner";
import { BlurLayer } from "@/components/blur-layer";

function AlbumContent() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [album, setAlbum] = useState<Album | null>(null);
  const [tabValue, setTabValue] = useState("song");
  const playList = usePlayerStore((s) => s.playList);
  const [isPinned, setIsPinned] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  const albumListSet = useUserStore((s) => s.albumListSet);
  const toggleLikeAlbum = useUserStore((s) => s.toggleLikeAlbum);
  const isLike = albumListSet.has(Number(id));
  const likeIcon = isLike ? (
    <Heart24Filled className="size-4 text-red-500" />
  ) : (
    <Heart24Regular className="size-4" />
  );

  useEffect(() => {
    async function fetchAlbumDetail() {
      setLoading(true);
      try {
        if (!id) return;
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

  async function toggleLike() {
    const targetLike = !isLike;

    toggleLikeAlbum(album!, targetLike);

    try {
      const res = await subAlbum(id!, targetLike ? 1 : 2);

      if (!res) {
        toggleLikeAlbum(album!, isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
      }
    } catch (err) {
      toggleLikeAlbum(album!, isLike);
      toast.error("操作失败，请稍后重试...", { position: "top-center" });
    }
  }

  useEffect(() => {
    const root = document.getElementById("main-scroll-container");
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(!entry.isIntersecting);
      },
      {
        root,
        rootMargin: "-10px 0px 0px 0px",
        threshold: 0,
      },
    );

    if (headerRef.current) {
      observer.observe(headerRef.current);
    }

    return () => observer.disconnect();
  }, [loading]);

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

  if (!id) return <div className="p-8">未找到专辑</div>;

  if (loading || !album) return <AlbumSkeleton />;

  return (
    <div className="w-full h-full py-8 flex flex-col">
      <div className="flex gap-8 items-center mb-8 px-8" ref={headerRef}>
        <div className="w-44 h-44 flex-none relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
          <img src={album.picUrl!} alt={album.name} className="object-cover" />
        </div>

        <div className="flex flex-col">
          <span className="text-2xl font-bold text-foreground select-text">
            {album.name}
          </span>
          <div className="flex flex-col gap-2">
            <div>
              {album.artists!.map((ar, index) => (
                <Link
                  key={`${ar.id}`}
                  to={`/detail/artist?id=${ar.id}`}
                  className="text-primary hover:text-primary/60 text-xl font-medium"
                >
                  {ar.name}
                  {index !== album.artists!.length - 1 && "、"}
                </Link>
              ))}
            </div>
            <span className="text-foreground/60 text-sm">
              {formateDate(album.publishTime!)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10 pt-6 pb-10",
        )}
      >
        <div className="px-8 z-10">
          <Tabs value={tabValue} onValueChange={(v) => setTabValue(v)}>
            <TabsList>
              <TabsTrigger value="song">歌曲</TabsTrigger>
              <TabsTrigger value="comment">评论</TabsTrigger>
              <TabsTrigger value="desc">专辑详情</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex gap-4 pr-8 z-10">
          <YeeButton
            variant="outline"
            className="bg-primary! text-white"
            onClick={() => playList(id, "album")}
            icon={<Play24Filled className="size-4" />}
          />
          <YeeButton variant="outline" icon={likeIcon} onClick={toggleLike} />
        </div>

        {isPinned && <BlurLayer />}
      </div>

      <div className="flex-1 w-full h-full px-8">{renderContent()}</div>
    </div>
  );
}

export default function AlbumDetailPage() {
  return (
    <Suspense
      fallback={
        <div>
          <AlbumSkeleton />
        </div>
      }
    >
      <AlbumContent />
    </Suspense>
  );
}
