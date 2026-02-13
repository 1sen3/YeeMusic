import { getRecentAlbum, RecentAlbumData } from "@/lib/services/recent";
import { AlbumItem } from "../album/album-item";
import { Loading } from "../loading";
import useSWR from "swr";

export function RecentAlbum() {
  const { data, isLoading } = useSWR<RecentAlbumData[]>(
    "recentAlbum",
    async () => {
      const res = await getRecentAlbum();
      return res.data.list;
    },
  );

  return (
    <div className="w-full h-full">
      {isLoading && <Loading />}
      <div className="w-full grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-12">
        {data?.map((album) => (
          <AlbumItem
            album={album.data}
            key={album.data.id}
            showArtist={true}
            showDate={false}
          />
        ))}
      </div>
    </div>
  );
}
