import { getRecentSong, RecentSongData } from "@/lib/services/recent";
import { Loading } from "../loading";
import { SongListItem } from "../song/song-list-item";
import useSWR from "swr";

export function RecentSong() {
  const { data, isLoading } = useSWR<RecentSongData[]>(
    "recentSong",
    async () => {
      const res = await getRecentSong();
      return res.data.list;
    },
  );

  return (
    <div className="w-full h-full">
      {isLoading && <Loading />}
      <div className="flex-1 flex flex-col gap-4">
        {data?.map((song, index) => {
          return (
            <SongListItem
              key={song.data.id}
              song={song.data}
              index={index}
              showCover={true}
            />
          );
        })}
      </div>
    </div>
  );
}
