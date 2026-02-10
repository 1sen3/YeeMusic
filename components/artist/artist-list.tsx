import { Artist } from "@/lib/types";
import { ArtistItem } from "./artist-item";

export function ArtistList({ artistList }: { artistList: Artist[] }) {
  return (
    <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-12">
      {artistList.map((ar) => (
        <ArtistItem artist={ar} key={ar.id} />
      ))}
    </div>
  );
}
