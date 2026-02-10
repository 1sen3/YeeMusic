import { Album } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Play24Filled } from "@fluentui/react-icons";
import Image from "next/image";

export function AlbumItem({ album }: { album: Album }) {
  return (
    <div className="w-32 flex flex-col gap-4">
      <div className="size-32 rounded-md overflow-hidden relative drop-shadow-md group cursor-pointer">
        <Image
          src={album.picUrl!}
          alt={`${album.name} Cover`}
          fill
          loading="lazy"
          className="group-hover:brightness-60 transition-all duration-300"
        />

        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        >
          <Play24Filled className="size-8 text-white" />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold line-clamp-1">{album.name}</span>
        <span className="line-clamp-1 text-black/60">
          {album.artists!.map((ar) => ar.name).join("、")}
        </span>
      </div>
    </div>
  );
}
