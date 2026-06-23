import { BlurLayer } from "@/components/blur-layer";
import { SongList } from "@/components/song/song-list";
import { Input } from "@/components/ui/input";
import { YeeButton } from "@/components/yee-button";
import { Popover, PopoverItem } from "@/components/yee-popover";
import { SONG_SORT_OPTIONS } from "@/lib/constants/song";
import { LocalTrackToSong } from "@/lib/services/localMusic";
import { useLocalMusicStore } from "@/lib/store/localMusicStore/localMusicStore";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { cn } from "@/lib/utils";
import {
	ArrowSync24Regular,
	ChevronDown24Regular,
	Play24Filled,
	Search24Filled,
} from "@fluentui/react-icons";
import Pinyin from "pinyin-match";
import { useMemo, useState } from "react";

function matchesPinyin(text: string, query: string): boolean {
	const normalizedQuery = query.toLowerCase();
	return (
		text.toLowerCase().includes(normalizedQuery) || !!Pinyin.match(text, query)
	);
}

export default function LocalPage() {
	const localTracks = useLocalMusicStore((s) => s.tracks);
	const isScanning = useLocalMusicStore((s) => s.isScanning);
	const scanAll = useLocalMusicStore((s) => s.scanAll);
	const scanDirs = useLocalMusicStore((s) => s.scanDirs);
	const playQueue = usePlayerStore((s) => s.playQueue);

	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("date");

	const songs = useMemo(() => localTracks.map(LocalTrackToSong), [localTracks]);

	const visibleSongs = useMemo(() => {
		const query = searchQuery.trim();
		let result = [...songs];

		if (query) {
			result = result.filter(
				(song) =>
					matchesPinyin(song.name, query) ||
					(song.al?.name && matchesPinyin(song.al.name, query)) ||
					song.ar?.some((artist) => matchesPinyin(artist.name, query)),
			);
		}

		if (result.length === 0) return result;

		return [...result].sort((a, b) => {
			switch (sortOption) {
				case "name":
					return a.name.localeCompare(b.name, "zh-CN");
				case "artist":
					return (a.ar?.[0]?.name || "").localeCompare(
						b.ar?.[0]?.name || "",
						"zh-CN",
					);
				case "album":
					return (a.al?.name || "").localeCompare(b.al?.name || "", "zh-CN");
				case "duration":
					return (b.dt || 0) - (a.dt || 0);
				case "date":
				default:
					return 0;
			}
		});
	}, [searchQuery, songs, sortOption]);

	function handlePlayVisibleSongs() {
		if (visibleSongs.length === 0) return;
		void playQueue(visibleSongs);
	}

	const emptyText =
		songs.length > 0
			? "没有找到匹配的本地歌曲"
			: scanDirs.length === 0
				? "前往设置添加音乐文件夹"
				: "未找到音乐文件";

	return (
		<div className="relative flex min-h-full w-full flex-col px-0 pb-8">
			<div
				className={cn(
					"sticky top-0 z-10 flex shrink-0 items-center justify-between gap-8 py-6",
				)}
			>
				<div className="z-10 flex items-center gap-4 px-8">
					<YeeButton
						variant="glass"
						size="lg"
						content={
							<div className="flex w-26 items-center justify-center gap-2">
								<Play24Filled className="size-4" />
								<span>播放</span>
							</div>
						}
						onClick={handlePlayVisibleSongs}
						disabled={visibleSongs.length === 0}
					/>

					<YeeButton
						icon={
							<ArrowSync24Regular
								className={isScanning ? "animate-spin" : ""}
							/>
						}
						variant="glass"
						size="lg"
						onClick={scanAll}
						disabled={isScanning || scanDirs.length === 0}
						title={isScanning ? "扫描中..." : "重新扫描"}
					/>
				</div>

				<BlurLayer />

				<div className="z-10 flex items-center gap-4 pr-8">
					<Popover
						trigger={
							<div className="flex items-center gap-2 rounded-sm px-4 py-2 hover:bg-foreground/5">
								<span className="font-light text-sm">排序方式：</span>
								<span className="font-semibold text-primary text-sm">
									{SONG_SORT_OPTIONS[sortOption]}
								</span>
								<ChevronDown24Regular className="size-4 text-foreground/60" />
							</div>
						}
					>
						{Object.entries(SONG_SORT_OPTIONS).map(([value, label]) => (
							<PopoverItem
								key={value}
								isActive={sortOption === value}
								onClick={() => setSortOption(value)}
							>
								{label}
							</PopoverItem>
						))}
					</Popover>

					<div className="relative flex items-center">
						<Search24Filled className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-foreground/60" />
						<Input
							showIndicator={false}
							placeholder={searchOpen ? "搜索..." : ""}
							className={cn(
								"h-9 rounded-full border-transparent bg-transparent! text-foreground",
								"focus:border-transparent focus:ring-0!",
								"transition-all duration-300 ease-in-out",
								searchOpen ? "w-48 pl-8" : "w-9",
							)}
							containerClassName="rounded-full yee-glass-surface"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							onFocus={() => setSearchOpen(true)}
							onBlur={() => {
								if (!searchQuery) setSearchOpen(false);
							}}
						/>
					</div>
				</div>
			</div>

			<div className="h-full w-full flex-1 px-8">
				{visibleSongs.length === 0 && !isScanning ? (
					<div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
						<span className="text-sm">{emptyText}</span>
					</div>
				) : (
					<SongList songList={visibleSongs} showCover={true} showAlbum={true} />
				)}
			</div>
		</div>
	);
}
