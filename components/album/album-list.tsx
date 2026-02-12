import { Album } from "@/lib/types";
import { AlbumItem } from "./album-item";

export function AlbumList({
  albumList,
  showArtist = true,
  showDate = false,
}: {
  albumList: Album[];
  showArtist?: boolean;
  showDate?: boolean;
}) {
  return (
    <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-12">
      {albumList.map((album) => (
        <AlbumItem
          album={album}
          key={album.id}
          showArtist={showArtist}
          showDate={showDate}
        />
      ))}
    </div>
  );
}
