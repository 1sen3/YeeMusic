import { Song } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { MoreHorizontal24Regular, Play24Filled } from "@fluentui/react-icons";
import { Button } from "../ui/button";
import Image from "next/image";
import { usePlayerStore } from "@/lib/store/playerStore";

export function SongListItem({ song, index }: { song: Song; index: number }) {
  const playSong = usePlayerStore((s) => s.playSong);

  return (
    <div className="flex-1 flex flex-col hover:bg-gray-500/10 rounded-md">
      <div className="grid grid-cols-[1fr_1fr_1fr_80px_30px] items-center px-4 py-3">
        {/* <span className="text-black/60 text-sm font-semibold translate-x-2">
          {index + 1}
        </span> */}

        <div className="flex gap-4 items-center">
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
          <span className="line-clamp-1 w-3/4 font-semibold">{song.name}</span>
        </div>

        <span className="line-clamp-1 w-3/4">
          {song.ar?.map((ar) => ar.name).join("、")}
        </span>

        <span className="line-clamp-1 w-3/4 text-black/60">
          {song.al?.name || "未知专辑"}
        </span>
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
