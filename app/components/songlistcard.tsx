"use client";

import Image from "next/image";
import { AlbumDetails } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Play24Filled,
  Play24Regular,
  Play28Filled,
} from "@fluentui/react-icons";
import { useState } from "react";

export function SongListCard({ album }: { album: AlbumDetails | null }) {
  const [isHover, setIsHover] = useState<boolean>(false);

  if (!album) {
    return (
      <div className="w-36 flex flex-col gap-3">
        <div className="w-full h-36 rounded-lg overflow-hidden">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="flex flex-col gap-3 w-full">
          <Skeleton className="w-full h-4" />

          <Skeleton className="w-16 h-4" />
        </div>
      </div>
    );
  }

  const title = album.name;
  const artists = album.artists.map((ar) => ar.name).join("、");

  return (
    <div className="w-36 flex flex-col gap-2">
      <div
        className="w-full h-36 rounded-lg shadow-md overflow-hidden group"
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <div className="w-full h-full relative cursor-pointer">
          <Image
            className="group-hover:brightness-50 transition duration-300 ease-in-out w-full h-full object-cover"
            width={144}
            height={144}
            src={album?.picUrl}
            alt="Album cover"
          />
          {isHover && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white">
              <Play28Filled />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-0.5 w-full overflow-hidden">
        <div className="w-full truncate">
          <span>{title}</span>
        </div>
        <div className="w-full truncate">
          <span className=" text-gray-500 text-sm">{artists}</span>
        </div>
      </div>
    </div>
  );
}
