import { Playlist } from "@/lib/types";
import Image from "next/image";
import { Play24Filled } from "@fluentui/react-icons";
import Link from "next/link";
import { YeeButton } from "../yee-button";

export function PlaylistItem({ playlist }: { playlist: Playlist }) {
  return (
    <div className="flex gap-4">
      <div className="size-24 relative rounded-md overflow-hidden drop-shadow-md cursor-pointer group">
        <Link href={`/detail/playlist/${playlist.id}`}>
          <Image
            src={playlist.coverImgUrl!}
            alt={`${playlist.name} cover`}
            fill
            className="group-hover:brightness-60 transition-all duration-300"
          />
        </Link>
      </div>
      <div className="flex flex-col justify-between items-start">
        <div className="flex flex-col">
          <span className="font-semibold text-md">{playlist.name}</span>
          <span className="text-black/60 text-sm">
            {playlist.creator.nickname}
          </span>
        </div>
        <YeeButton
          variant="outline"
          icon={<Play24Filled className="size-4" />}
        />
      </div>
    </div>
  );
}
