"use client";

import Image from "next/image";
import { RecentListenResource } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Play28Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MyTooltip } from "@/components/my-tooltip";
import { usePlayerStore } from "@/lib/store/playerStore";
import Link from "next/link";

export function RecentListenCard({
  resource,
}: {
  resource: RecentListenResource | null;
}) {
  const { playList } = usePlayerStore();

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation();
    if (resource?.resourceId)
      playList(resource?.resourceId, resource.resourceType);
  }

  if (!resource) {
    return (
      <div className="w-32 flex flex-col gap-3">
        <div className="w-full h-32 rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Skeleton className="w-full h-4" />

          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    );
  }

  const title = resource.title;
  const cover = resource.coverUrlList?.[0];
  const tag = resource.tag;

  const typeLink =
    resource.resourceType === "list" ? "playlist" : resource.resourceType;
  const link = `/detail/${typeLink}/${resource.resourceId}`;

  return (
    <div className="w-32 flex flex-col gap-4">
      <div className="w-full h-32 rounded-lg drop-shadow-md overflow-hidden group border cursor-pointer">
        <div className="w-full h-full relative  group-hover:brightness-50 ">
          <Link href={link}>
            <Image
              className="transition duration-300 ease-in-out w-full h-full object-cover"
              fill
              src={cover}
              alt="Album cover"
            />
          </Link>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)",
            }}
          />

          <span className="absolute bottom-2.5 left-2.5 text-sm font-medium text-white drop-shadow-md">
            {tag}
          </span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white hover:text-gray-200">
          <Play28Filled onClick={handlePlay} />
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full overflow-hidden">
        <p className="w-full line-clamp-2">{title}</p>
      </div>
    </div>
  );
}
