import { SongList } from "@/components/song/song-list";
import { Song } from "@/lib/types";

export function AlbumSongs({
	songs,
	itemSecondaryClassName,
	itemMetaClassName,
}: {
	songs: Song[];
	itemSecondaryClassName?: string;
	itemMetaClassName?: string;
}) {
	return (
		<div className="w-full h-full">
			{songs.length > 0 && (
				<SongList
					songList={songs}
					showCover={false}
					showAlbum={false}
					itemSecondaryClassName={itemSecondaryClassName}
					itemMetaClassName={itemMetaClassName}
				/>
			)}
		</div>
	);
}
