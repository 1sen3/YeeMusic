"use client";

import Image from "next/image";
import { RecentListenResource } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Play28Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MyTooltip } from "@/components/my-tooltip";
import { usePlayerStore } from "@/lib/store/playerStore";

export function RecentListenCard({
  resource,
}: {
  resource: RecentListenResource | null;
}) {
  const [isHover, setIsHover] = useState<boolean>(false);
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

  return (
    <div className="w-32 flex flex-col gap-4">
      <div
        className="w-full h-32 rounded-lg drop-shadow-md overflow-hidden group border"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <div
          className="w-full h-full relative cursor-pointer"
          onClick={handlePlay}
        >
          <Image
            className="group-hover:brightness-50 transition duration-300 ease-in-out w-full h-full object-cover"
            fill
            src={cover}
            alt="Album cover"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)",
            }}
          />
          {isHover && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
              <Play28Filled />
            </div>
          )}
          <span className="absolute bottom-2.5 left-2.5 text-sm font-medium text-white drop-shadow-md group-hover:brightness-50">
            {tag}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2 w-full overflow-hidden">
        <p className="w-full line-clamp-2">{title}</p>
      </div>
    </div>
  );
}
