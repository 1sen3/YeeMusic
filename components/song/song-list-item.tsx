import { Song } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import { MoreHorizontal24Regular, Play24Filled } from "@fluentui/react-icons";
import { Button } from "../ui/button";
import Image from "next/image";
import { usePlayerStore } from "@/lib/store/playerStore";
import Link from "next/link";

export function SongListItem({
  song,
  index,
  showCover = true,
}: {
  song: Song;
  index: number;
  showCover: boolean;
}) {
  const playSong = usePlayerStore((s) => s.playSong);

  return (
    <div
      className={cn(
        "flex-1 flex flex-col hover:bg-black/5 rounded-md",
        index % 2 === 0 && "bg-black/2",
        "transition-colors duration-300",
      )}
    >
      <div className="grid grid-cols-[1fr_1fr_1fr_80px_30px] items-center px-4 py-3 group">
        <div className="flex gap-4 items-center ">
          {showCover ? (
            <div
              className="w-12 h-12 relative rounded-sm overflow-hidden shrink-0 shadow-sm group cursor-pointer"
              onClick={() => playSong(song)}
            >
              <Image
                className="group-hover:brightness-50 transition-all duration-300"
                src={song.al?.picUrl || ""}
                alt={`${song.al?.name}专辑封面`}
                fill
                loading="lazy"
              />

              <Play24Filled className="opacity-0 group-hover:opacity-100 size-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transition-opacity" />
            </div>
          ) : (
            <div className="size-6 flex items-center justify-center text-black/40">
              <span className="group-hover:hidden">{index + 1}</span>
              <div className="hidden group-hover:flex hover:text-black/60 cursor-pointer">
                <Play24Filled
                  className="size-4"
                  onClick={() => playSong(song)}
                />
              </div>
            </div>
          )}
          <span className="line-clamp-1 w-3/4 font-semibold">{song.name}</span>
        </div>

        <div className="line-clamp-1 w-3/4">
          {song.ar!.map((ar, idx) => (
            <Link
              key={`${song.id}-${ar.id}-${idx}`}
              href={`/detail/artist/${ar.id}`}
            >
              <span className="text-black/60 hover:text-black/80 cursor-pointer">
                {ar.name}
                {idx < song.ar!.length - 1 && "、"}
              </span>
            </Link>
          ))}
        </div>

        {song.al.name ? (
          <Link href={`/detail/album/${song.al.id}`}>
            <span className="line-clamp-1 w-3/4 text-black/60 hover:text-black/80 cursor-pointer">
              {song.al.name}
            </span>
          </Link>
        ) : (
          <span className="line-clamp-1 w-3/4 text-black/60">未知专辑</span>
        )}

        <span className=" text-black/60">
          {formatTime((song.dt || 1) / 1000)}
        </span>
        <span>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <MoreHorizontal24Regular className="size-4" />
          </Button>
        </span>
      </div>
    </div>
  );
}
