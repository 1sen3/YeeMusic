import { getRecentPlaylist, RecentPlaylistData } from "@/lib/services/recent";
import { Loading } from "../loading";
import { PlaylistItem } from "../playlist/playlist-item";
import useSWR from "swr";

export function RecentPlaylist() {
  const { data, isLoading } = useSWR<RecentPlaylistData[]>(
    "recentPlaylist",
    async () => {
      const res = await getRecentPlaylist();
      return res.data.list;
    },
  );

  return (
    <div className="w-full h-full">
      {isLoading && <Loading />}
      <div
        className="w-full grid gap-12"
        style={{ gridTemplateColumns: "repeat(2, 1fr)" }}
      >
        {data?.map((playlist) => (
          <PlaylistItem playlist={playlist.data} key={playlist.data.id} />
        ))}
      </div>
    </div>
  );
}
