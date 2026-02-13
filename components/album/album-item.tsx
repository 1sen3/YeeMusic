import { Album } from "@/lib/types";
import { cn, formateDate } from "@/lib/utils";
import { Play24Filled, PlayCircle24Filled } from "@fluentui/react-icons";
import Image from "next/image";
import { usePlayerStore } from "@/lib/store/playerStore";
import Link from "next/link";

export function AlbumItem({
  album,
  showArtist,
  showDate,
}: {
  album: Album;
  showArtist: boolean;
  showDate: boolean;
}) {
  const playList = usePlayerStore((s) => s.playList);

  return (
    <div className="w-32 flex flex-col gap-4">
      <div className="size-32 rounded-md overflow-hidden relative drop-shadow-md group cursor-pointer">
        <Link href={`/detail/album/${album.id}`}>
          <Image
            src={album.picUrl!}
            alt={`${album.name} Cover`}
            fill
            loading="lazy"
            className="group-hover:brightness-60 transition-all duration-300"
          />
        </Link>

        <div
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        >
          <Play24Filled
            className="size-10 text-white drop-shadow-md hover:text-gray-200"
            onClick={() => playList(album.id, "album")}
          />
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-semibold line-clamp-1">{album.name}</span>
        {showArtist && (
          // <span className="line-clamp-1 text-black/60">
          //   {album.artists!.map((ar) => ar.name).join("、")}
          // </span>
          <div className="line-clamp-1">
            {album.artists?.map((ar, index) => (
              <Link
                href={`/detail/artist/${ar.id}`}
                key={`{ar.id}-${index}`}
                className="text-black/60 hover:text-black/80"
              >
                {ar.name}
                {index !== album.artists!.length - 1 && "、"}
              </Link>
            ))}
          </div>
        )}
        {showDate && (
          <span className="text-black/60 text-sm">
            {formateDate(album.publishTime!)}
          </span>
        )}
      </div>
    </div>
  );
}
