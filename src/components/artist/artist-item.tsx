import { Artist } from "@/lib/types";
import { Link } from "react-router-dom";

export function ArtistItem({ artist }: { artist: Artist }) {
  return (
    <div className="w-32 flex flex-col gap-4">
      <Link to={`/detail/artist?id=${artist.id}`}>
        <div className="size-32 rounded-full overflow-hidden relative border border-border group cursor-pointer">
          <img
            src={artist.img1v1Url || artist.picUrl || artist.cover!}
            alt={`${artist.name} Cover`}
            loading="lazy"
            className="group-hover:brightness-60 transition duration-300 object-cover"
          />
        </div>
      </Link>
      <div className="flex flex-col gap-2 items-center">
        <span className="font-semibold line-clamp-1 text-sm">
          {artist.name}
        </span>
      </div>
    </div>
  );
}
