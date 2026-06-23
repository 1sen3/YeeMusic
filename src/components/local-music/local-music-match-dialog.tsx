import {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { matchLocalMusic } from "@/lib/services/localMusicMatch";
import { useLocalMusicStore } from "@/lib/store/localMusicStore/localMusicStore";
import { useLocalMusicMatchDialogStore } from "@/lib/store/localMusicMatchDialogStore";
import type { Song } from "@/lib/types";
import { GetThumbnail, cn, formatDuration } from "@/lib/utils";
import { MusicNote224Filled, Search24Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { YeeButton } from "../yee-button";

interface MatchQuery {
	title: string;
	artist: string;
	album: string;
}

export function LocalMusicMatchDialog() {
	const song = useLocalMusicMatchDialogStore((s) => s.song);
	const close = useLocalMusicMatchDialogStore((s) => s.close);
	const setNeteaseMatch = useLocalMusicStore((s) => s.setNeteaseMatch);
	const clearNeteaseMatch = useLocalMusicStore((s) => s.clearNeteaseMatch);

	const [candidates, setCandidates] = useState<Song[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [loading, setLoading] = useState(false);
	const [query, setQuery] = useState<MatchQuery>({
		title: "",
		artist: "",
		album: "",
	});

	const metadata = song?.localOriginalMetadata;
	const matchedSongId = song?.localMatchedSongId;
	const selectedSong = candidates.find(
		(candidate) => candidate.id === selectedId,
	);

	useEffect(() => {
		if (!song) {
			setCandidates([]);
			setSelectedId(null);
			setQuery({ title: "", artist: "", album: "" });
			return;
		}

		let cancelled = false;
		const nextQuery = {
			title: metadata?.title || song.name || "",
			artist:
				metadata?.artist ||
				song.ar?.map((artist) => artist.name).join(" / ") ||
				"",
			album: metadata?.album || song.al?.name || "",
		};
		const duration = metadata?.durationSecs ?? (song.dt || 0) / 1000;

		setQuery(nextQuery);
		setLoading(true);
		setCandidates([]);
		setSelectedId(song.localMatchedSongId ?? null);

		matchLocalMusic({
			title: nextQuery.title,
			album: nextQuery.album,
			artist: nextQuery.artist,
			duration,
		})
			.then((songs) => {
				if (cancelled) return;
				setCandidates(songs);
				setSelectedId((current) => current ?? songs[0]?.id ?? null);
			})
			.catch((err) => {
				if (!cancelled) {
					console.error("[LocalMusicMatch]", err);
					toast.error("匹配失败，请稍后再试");
				}
			})
			.finally(() => {
				if (!cancelled) {
					setLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [metadata, song]);

	function handleConfirm() {
		if (!song?.localFilePath || !selectedSong) return;

		void setNeteaseMatch(song.localFilePath, selectedSong).catch((err) => {
			console.error("[LocalMusicMatch]", err);
			toast.error("匹配已应用，但保存到本地缓存失败");
		});

		toast.success("已匹配网易云歌曲");
		close();
	}

	function handleClear() {
		if (!song?.localFilePath) return;

		void clearNeteaseMatch(song.localFilePath).catch((err) => {
			console.error("[LocalMusicMatch]", err);
			toast.error("已取消匹配，但保存到本地缓存失败");
		});

		toast.success("已取消匹配");
		close();
	}

	async function handleManualSearch() {
		if (!song || !query.title.trim()) return;

		setLoading(true);
		setCandidates([]);
		setSelectedId(null);

		try {
			const songs = await matchLocalMusic({
				title: query.title.trim(),
				album: query.album.trim(),
				artist: query.artist.trim(),
				duration: metadata?.durationSecs ?? (song.dt || 0) / 1000,
			});
			setCandidates(songs);
			setSelectedId(songs[0]?.id ?? null);
		} catch (err) {
			console.error("[LocalMusicMatch]", err);
			toast.error("匹配失败，请稍后再试");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Dialog open={!!song} onOpenChange={(open) => !open && close()}>
			<DialogContent className="max-w-xl">
				<DialogTitle>匹配网易云歌曲</DialogTitle>
				<DialogBody>
					<div className="flex flex-col gap-6">
						<div className="grid grid-cols-[1fr_1fr] gap-2">
							<label className="col-span-2 flex flex-col gap-1 text-muted-foreground text-xs">
								歌曲名
								<Input
									value={query.title}
									disabled={loading}
									onChange={(event) =>
										setQuery((current) => ({
											...current,
											title: event.target.value,
										}))
									}
								/>
							</label>
							<label className="flex flex-col gap-1 text-muted-foreground text-xs">
								歌手
								<Input
									value={query.artist}
									disabled={loading}
									onChange={(event) =>
										setQuery((current) => ({
											...current,
											artist: event.target.value,
										}))
									}
								/>
							</label>
							<label className="flex flex-col gap-1 text-muted-foreground text-xs">
								专辑
								<Input
									value={query.album}
									disabled={loading}
									onChange={(event) =>
										setQuery((current) => ({
											...current,
											album: event.target.value,
										}))
									}
								/>
							</label>
						</div>

						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0 text-muted-foreground text-xs">
								<div className="line-clamp-1">
									本地信息：{metadata?.title || song?.name}
								</div>
								<div className="line-clamp-1">
									{[metadata?.artist, metadata?.album]
										.filter(Boolean)
										.join(" / ")}
								</div>
							</div>
							<YeeButton
								variant="outline"
								icon={<Search24Regular />}
								onClick={handleManualSearch}
								disabled={loading || !query.title.trim()}
							/>
						</div>

						<div className="no-scrollbar flex max-h-80 flex-col gap-4 overflow-y-auto">
							{loading ? (
								<div className="flex h-28 items-center justify-center text-muted-foreground text-sm">
									正在搜索匹配项...
								</div>
							) : candidates.length === 0 ? (
								<div className="flex h-28 items-center justify-center text-muted-foreground text-sm">
									没有找到候选歌曲
								</div>
							) : (
								candidates.map((candidate) => (
									<button
										key={candidate.id}
										type="button"
										className={cn(
											"grid w-full grid-cols-[44px_1fr_auto] items-center gap-3 rounded-md border p-4 text-left transition-colors",
											selectedId === candidate.id
												? "bg-primary/10"
												: "bg-card hover:bg-foreground/5",
										)}
										onClick={() => setSelectedId(candidate.id)}
									>
										<SongCover song={candidate} />
										<div className="min-w-0">
											<div className="line-clamp-1 font-medium text-sm">
												{candidate.name}
											</div>
											<div className="line-clamp-1 text-muted-foreground text-xs">
												{candidate.ar?.map((artist) => artist.name).join(" / ")}
											</div>
											<div className="line-clamp-1 text-muted-foreground/80 text-xs">
												{candidate.al?.name}
											</div>
										</div>
										<span className="text-muted-foreground text-xs">
											{formatDuration((candidate.dt || 0) / 1000)}
										</span>
									</button>
								))
							)}
						</div>
					</div>
				</DialogBody>
				<DialogFooter>
					{matchedSongId && (
						<DialogCancel onClick={handleClear}>取消匹配</DialogCancel>
					)}
					<DialogCancel onClick={close}>关闭</DialogCancel>
					<DialogAction onClick={handleConfirm} disabled={!selectedSong}>
						确认匹配
					</DialogAction>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function SongCover({ song }: { song: Song }) {
	const coverUrl = song.al?.picUrl || song.album?.picUrl;
	return (
		<div className="flex size-11 items-center justify-center overflow-hidden rounded-sm bg-muted">
			{coverUrl ? (
				<img
					src={GetThumbnail(coverUrl)}
					alt=""
					className="size-full object-cover"
					draggable={false}
				/>
			) : (
				<MusicNote224Filled className="size-5 text-muted-foreground" />
			)}
		</div>
	);
}
