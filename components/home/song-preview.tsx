"use client";
import { Skeleton } from "@/components/ui/skeleton";
import { getSongDetail } from "@/lib/services/song";
import { likeSong } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useUserStore } from "@/lib/store/userStore";
import { Resource } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowDownload24Regular,
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { toast } from "sonner";

export function SongPreview({ resources }: { resources: Resource[] }) {
  return (
    <div className="flex flex-col gap-6 w-1/2">
      {resources.map((res) => (
        <SongPreviewItem resource={res} key={res.resourceId} />
      ))}
    </div>
  );
}

export function SongPreviewItem({ resource }: { resource: Resource }) {
  const isLiked = useUserStore((state) =>
    state.likeListSet.has(Number(resource?.resourceId)),
  );
  const LikeIcon = isLiked ? Heart24Filled : Heart24Regular;
  const toggleLike = useUserStore((state) => state.toggleLike);

  const uiElement = resource?.uiElement;
  const resourceExtInfo = resource?.resourceExtInfo;
  const title =
    uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const artists = resourceExtInfo?.artists || [];
  const cover = uiElement?.image?.imageUrl || "";

  const { playSong } = usePlayerStore();

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();

    const targetState = !isLiked;

    toggleLike(Number(resource.resourceId), targetState);

    try {
      const res = await likeSong(resource.resourceId, targetState);

      if (!res) {
        toggleLike(Number(resource.resourceId), isLiked);
        toast.error("操作失败，请重试", { position: "top-center" });
      }
    } catch (err) {
      toggleLike(Number(resource.resourceId), isLiked);
      toast.error("操作失败，请重试", { position: "top-center" });
      console.log("切换歌曲喜欢状态失败", err);
    }
  }

  if (!resource) {
    return (
      <div className="bg-white flex gap-4 justify-between">
        <div className="w-16 h-16 rounded-sm overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>

        <div className="flex-1 flex flex-col gap-2 justify-center">
          <Skeleton className="w-1/2 h-4" />
          <Skeleton className="w-1/4 h-4" />
        </div>
      </div>
    );
  }

  async function handlePlay() {
    const songId = resource.resourceId;
    if (!songId) return;

    const res = await getSongDetail([songId]);
    if (res && res.songs?.length > 0) {
      playSong(res.songs[0]);
    }
  }

  return (
    <div className="flex gap-4 justify-between group overflow-hidden ">
      <div
        className="w-16 h-16 rounded-sm overflow-hidden relative  cursor-pointer border"
        onClick={handlePlay}
      >
        <Image
          loading="lazy"
          src={cover}
          fill
          alt="Album cover"
          className="object-cover group-hover:brightness-50 transform transition-all duration-300 ease-in-out"
        />

        <div className="cursor-pointer opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transform transition-all duration-300 ease-in-out">
          <Play24Filled width={24} height={24} />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 justify-center">
        <span className="text-sm font-medium">{title}</span>
        <div className="line-clamp-1">
          {artists.map((ar, idx) => (
            <Link href={`/detail/artist/${ar.id}`} key={`${ar.id}-${idx}`}>
              <span className="text-sm text-black/60 hover:text-black/80">
                {ar.name}
                {idx < artists.length - 1 && "、"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 pr-6 translate-x-20 group-hover:translate-x-0 transform transition-all duration-300 ease-in-out">
        <ArrowDownload24Regular className="size-5 text-black/60 cursor-pointer hover:text-black/80" />
        <LikeIcon
          onClick={handleLike}
          className={cn(
            "size-5 text-black/60 cursor-pointer hover:text-black/80",
            isLiked && "text-red-500 hover:text-red-700",
          )}
        />
        <MoreHorizontal24Regular className="size-5 text-black/60 cursor-pointer hover:text-black/80" />
      </div>
    </div>
  );
}
