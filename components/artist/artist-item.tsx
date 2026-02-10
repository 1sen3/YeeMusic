import { Artist } from "@/lib/types";
import Image from "next/image";

export function ArtistItem({ artist }: { artist: Artist }) {
  return (
    <div className="w-32 flex flex-col gap-4">
      <div className="size-32 rounded-full overflow-hidden relative drop-shadow-md group cursor-pointer">
        <Image
          src={artist.img1v1Url || artist.picUrl || artist.cover!}
          alt={`${artist.name} Cover`}
          fill
          loading="lazy"
          className="group-hover:brightness-60 transition duration-300"
        />
      </div>
      <div className="flex flex-col gap-2 items-center">
        <span className="font-semibold line-clamp-1">{artist.name}</span>
      </div>
    </div>
  );
}
