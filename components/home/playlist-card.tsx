"use client";

import Image from "next/image";
import { Resource } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Play28Filled } from "@fluentui/react-icons";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/playerStore";
import Link from "next/link";

export function PlaylistCard({ resource }: { resource: Resource | null }) {
  const { playList } = usePlayerStore();

  function handlePlay() {
    if (resource?.resourceId) {
      if (resource?.resourceType !== "song")
        playList(resource.resourceId, resource.resourceType);
    }
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

  const uiElement = resource.uiElement;
  const title =
    uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const cover = uiElement?.image?.imageUrl || "";

  return (
    <div className="w-32 flex flex-col gap-4">
      <div className="w-full h-32 rounded-lg shadow-md overflow-hidden group border">
        <div className="w-full h-full relative cursor-pointer">
          <Link href={`/detail/playlist/${resource.resourceId}`}>
            <Image
              className={cn(
                "group-hover:brightness-50 transition duration-300 ease-in-out w-full h-full object-cover",
              )}
              width={144}
              height={144}
              src={cover}
              alt="Album cover"
            />
          </Link>
          <div className="opacity-0 group-hover:opacity-100 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white hover:text-gray-200">
            <Play28Filled onClick={handlePlay} />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
        <p className="w-full line-clamp-2 text-sm font-medium">
          {title.split("|")[0]}
        </p>
      </div>
    </div>
  );
}
