import { SongList } from "@/components/song/song-list";
import { Song } from "@/lib/types";
import { CollectionsEmpty24Regular } from "@fluentui/react-icons";
import { useMemo } from "react";
import Pinyin from "pinyin-match";
import { Spinner } from "@/components/ui/spinner";

function matchesPinyin(text: string, q: string): boolean {
	return text.toLowerCase().includes(q) || !!Pinyin.match(text, q);
}

export function PlaylistSongs({
	songs,
	query,
	sort,
	isLoading = false,
	onReorder,
}: {
	songs: Song[];
	query: string;
	sort?: string;
	isLoading?: boolean;
	onReorder?: (from: number, to: number) => void;
}) {
	// 仅在展示原始顺序（无搜索、默认排序）时才允许拖动，
	// 否则列表索引无法对应到歌单的真实顺序
	const sortable = !!onReorder && !query && (!sort || sort === "date");
	const filteredAndSortedSongs = useMemo(() => {
		let result = [...songs];
		if (query) {
			result = result.filter(
				(s) =>
					matchesPinyin(s.name, query) ||
					(s.al?.name && matchesPinyin(s.al.name, query)) ||
					s.ar?.some((a) => matchesPinyin(a.name, query)),
			);
		}

		if (!sort || result.length === 0) return result;

		return [...result].sort((a, b) => {
			switch (sort) {
				case "name":
					return a.name.localeCompare(b.name, "zh-CN");
				case "artist":
					const artistA = a.ar?.[0]?.name || "";
					const artistB = b.ar?.[0]?.name || "";
					return artistA.localeCompare(artistB, "zh-CN");

				case "album":
					const albumA = a.al?.name || "";
					const albumB = b.al?.name || "";
					return albumA.localeCompare(albumB, "zh-CN");

				case "duration":
					const dtA = a.dt || 0;
					const dtB = b.dt || 0;
					return dtB - dtA;

				case "date":
					return 0;

				default:
					return 0;
			}
		});
	}, [songs, query, sort]);

	return (
		<div className="w-full h-full">
			{songs && (
				<SongList
					songList={filteredAndSortedSongs}
					showAlbum={true}
					sortable={sortable}
					onReorder={onReorder}
				/>
			)}
			{!songs.length && !isLoading && (
				<div className="h-64 text-black/60 flex items-center justify-center gap-4">
					<CollectionsEmpty24Regular /> 暂无歌曲
				</div>
			)}
			<div className="h-16 flex items-center justify-center text-foreground/50">
				{isLoading && <Spinner />}
			</div>
		</div>
	);
}
