import { Playlist } from "@/lib/types";
import Image from "next/image";
import { Button } from "../ui/button";
import { Play24Filled } from "@fluentui/react-icons";

export function PlaylistItem({ playlist }: { playlist: Playlist }) {
  return (
    <div className="flex gap-4">
      <div className="size-24 relative rounded-md overflow-hidden drop-shadow-md cursor-pointer group">
        <Image
          src={playlist.coverImgUrl!}
          alt={`${playlist.name} cover`}
          fill
          className="group-hover:brightness-60 transition-all duration-300"
        />
      </div>
      <div className="flex flex-col justify-between">
        <div className="flex flex-col">
          <span className="font-semibold">{playlist.name}</span>
          <span className="text-black/60">{playlist.creator.nickname}</span>
        </div>
        <Button
          className="w-fit p-2 rounded-full cursor-pointer drop-shadow-md border-0"
          variant="outline"
          size="icon"
        >
          <Play24Filled className="size-4" />
        </Button>
      </div>
    </div>
  );
}
