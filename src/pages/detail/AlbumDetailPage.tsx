import {
  Heart24Filled,
  Heart24Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import {
  type CSSProperties,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { AlbumDescDialog } from "@/components/album/detail/album-desc-dialog";
import { AlbumSongs } from "@/components/album/detail/album-songs";
import { Entrance } from "@/components/entrance";
import { PinnedBar, usePinned } from "@/components/pinned-bar";
import { AlbumSkeleton } from "@/components/skeleton/album-skeleton";
import { YeeButton } from "@/components/yee-button";
import { useAmbientColor } from "@/hooks/use-ambient-color";
import { getAlbum } from "@/lib/services/album";
import { subAlbum } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { cn, formateDate } from "@/lib/utils";

function AlbumContent() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [descOpen, setDescOpen] = useState(false);
  const playList = usePlayerStore((s) => s.playList);

  const { data: album, isLoading } = useSWR(
    id ? (["album", id] as const) : null,
    ([, albumId]) => getAlbum(albumId),
    { revalidateOnFocus: false },
  );

  const headerRef = useRef<HTMLDivElement>(null);
  const isPinned = usePinned(headerRef, !!album);

  const descRef = useRef<HTMLParagraphElement>(null);
  const [descOverflow, setDescOverflow] = useState(
    () => (album?.description?.length ?? 0) > 40,
  );
  useLayoutEffect(() => {
    const el = descRef.current;
    if (!el) return;

    const check = () => setDescOverflow(el.scrollHeight > el.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [album?.description]);

  const ambient = useAmbientColor(album?.picUrl);

  const isLoggedin = useUserStore((s) => s.isLoggedin);
  const albumListSet = useUserStore((s) => s.albumListSet);
  const toggleLikeAlbum = useUserStore((s) => s.toggleLikeAlbum);
  const isLike = albumListSet.has(Number(id));
  const likeIcon = isLike ? (
    <Heart24Filled className="size-4 text-red-500" />
  ) : (
    <Heart24Regular className="size-4" />
  );

  async function toggleLike() {
    if (!album || !id) return;

    const targetLike = !isLike;
    toggleLikeAlbum(album, targetLike);

    try {
      const res = await subAlbum(id, targetLike ? 1 : 2);
      if (!res) {
        toggleLikeAlbum(album, isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
      }
    } catch {
      toggleLikeAlbum(album, isLike);
      toast.error("操作失败，请稍后重试...", { position: "top-center" });
    }
  }

  if (!id) return <div className="p-8">未找到专辑</div>;

  if (isLoading || !album) return <AlbumSkeleton />;

  return (
    <div
      className={cn(
        "relative isolate flex-1 w-full py-8 flex flex-col",
        ambient && "ambient-page",
      )}
      style={
        ambient
          ? ({
              "--ambient-accent": ambient.accent,
              "--ambient-base": ambient.base,
            } as CSSProperties)
          : undefined
      }
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 transition-opacity duration-700"
        style={{
          opacity: ambient ? 1 : 0,
          background: ambient
            ? `linear-gradient(to bottom, ${ambient.base}, ${ambient.deep} 100vh)`
            : undefined,
        }}
      >
        <div className="absolute inset-0 hidden dark:block bg-black/30" />
      </div>

      <PinnedBar isPinned={isPinned} title={album.name} hideUntilPinned>
        <div className="flex gap-4 pl-8">
          <YeeButton
            variant="glass"
            size="lg"
            onClick={() => playList(id, "album")}
            content={
              <div className="w-26 flex gap-2 items-center justify-center">
                <Play24Filled className="size-4" />
                <span>播放</span>
              </div>
            }
          />
          <YeeButton
            variant="glass"
            size="lg"
            icon={likeIcon}
            onClick={() => {
              if (!isLoggedin) {
                toast.error("请先登录网易云账号");
                return;
              }
              toggleLike();
            }}
          />
        </div>
      </PinnedBar>

      <div className="flex gap-8 items-center mb-8 px-8" ref={headerRef}>
        <Entrance className="flex-none">
          <div className="size-64 relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
            <img
              src={album.picUrl ?? ""}
              alt={album.name}
              className="object-cover"
            />
          </div>
        </Entrance>

        <Entrance delay={0.06} className="flex flex-col gap-0">
          <div className="h-64 flex flex-col justify-between pt-6">
            <div className="flex flex-col gap-0">
              <span className="text-2xl font-bold tracking-tight text-foreground select-text">
                {album.name}
              </span>
              <div>
                {album.artists?.map((ar, index) => (
                  <Link
                    key={`${ar.id}`}
                    to={`/detail/artist?id=${ar.id}`}
                    className="text-primary hover:text-primary/60 text-xl font-normal"
                  >
                    {ar.name}
                    {index !== (album.artists?.length ?? 0) - 1 && "、"}
                  </Link>
                ))}
              </div>
              {album.publishTime && (
                <span className="text-white/50 text-sm mix-blend-plus-lighter">
                  {formateDate(album.publishTime)}
                </span>
              )}
            </div>

            <div
              className={cn(
                "hover:bg-foreground/5 rounded-lg p-3 -translate-x-3 mix-blend-plus-lighter transition-colors duration-200 cursor-pointer",
                descOverflow && "desc-more",
              )}
              onClick={() => album.description && setDescOpen(true)}
            >
              <p
                ref={descRef}
                className={cn(
                  "relative text-sm text-white/60 leading-6 tracking-wide max-h-12 overflow-hidden font-normal",
                  descOverflow && "desc-fade",
                )}
              >
                {album.description}
              </p>
            </div>

            <div className="flex gap-4 pr-8">
              <YeeButton
                variant="glass"
                size="lg"
                className="ambient-primary"
                onClick={() => playList(id, "album")}
                content={
                  <div className="w-26 flex gap-2 items-center justify-center">
                    <Play24Filled className="size-4" />
                    <span>播放</span>
                  </div>
                }
              />
              <YeeButton
                variant="glass"
                size="lg"
                icon={likeIcon}
                onClick={() => {
                  if (!isLoggedin) {
                    toast.error("请先登录网易云账号");
                    return;
                  }
                  toggleLike();
                }}
              />
            </div>
          </div>
        </Entrance>
      </div>

      <div className="flex-1 w-full h-full px-8">
        <AlbumSongs
          songs={album.songs ?? []}
          itemSecondaryClassName={
            ambient ? "text-white hover:text-white/80" : undefined
          }
          itemMetaClassName={
            ambient ? "mix-blend-plus-lighter text-white/50" : undefined
          }
        />
      </div>

      <AlbumDescDialog
        open={descOpen}
        onOpenChange={setDescOpen}
        title={album.name}
        desc={album.description ?? ""}
      />
    </div>
  );
}

export default function AlbumDetailPage() {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumContent />
    </Suspense>
  );
}
