import { getRecentSong, RecentSongData } from "@/lib/services/recent";
import { Loading } from "../loading";
import { SongListItem } from "../song/song-list-item";
import useSWR from "swr";
import { Virtuoso } from "react-virtuoso";

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
			<Virtuoso
				useWindowScroll
				customScrollParent={
					document.getElementById("main-scroll-container") as HTMLElement
				}
				data={data}
				itemContent={(index, song) => (
					<div className="pb-4">
						<SongListItem
							song={song.data}
							index={index}
							showCover={true}
							showAlbum={true}
						/>
					</div>
				)}
			/>
		</div>
	);
}
