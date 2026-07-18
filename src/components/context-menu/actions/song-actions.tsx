import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { ActionProps } from "./action";
import { useSongLogic } from "@/hooks/use-song-logic";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/lib/store/userStore/userStore";
import {
	ContextMenuButton,
	ContextMenuSeperator,
} from "../context-menu-button";
import {
	Album24Regular,
	ArrowDownload24Regular,
	Collections24Regular,
	Delete24Regular,
	Person24Regular,
	Play24Filled,
	Search24Regular,
	TextBulletListAdd24Regular,
} from "@fluentui/react-icons";
import { Resource, Song, SongQualityDetail } from "@/lib/types";
import { QUALITY_LIST } from "@/lib/constants/song";
import { getSongMusicDetail } from "@/lib/services/song";
import { useEffect, useState } from "react";
import { useDownloadStore } from "@/lib/store/downloadStore/downloadStore";
import { useAppWindow } from "@/hooks/use-app-window";
import { useLocalMusicMatchDialogStore } from "@/lib/store/localMusicMatchDialogStore";
import { requestCloseLyricSheet } from "@/lib/events/lyric-sheet";

export function SongActions({ type, data }: ActionProps) {
	const { closeMenu } = useContextMenuStore();
	const {
		handleLike,
		handlePlay,
		handleNextPlay,
		handleAddToPlaylist,
		handleRemoveFromPlaylist,
	} = useSongLogic();
	const { isInPlaylist } = usePlayerStore();
	const navigate = useNavigate();

	if (type !== "song" && data.resourceType !== "song") return null;

	const location = useLocation();
	const [searchParams] = useSearchParams();
	const playlistId = searchParams.get("id");

	const favPlaylist = useUserStore((s) => s.favPlaylist);
	const createdPlaylists = useUserStore((s) => s.createdPlaylists);
	const collectablePlaylists = favPlaylist
		? [favPlaylist, ...createdPlaylists]
		: createdPlaylists;

	const isPlaylistPage = location.pathname.includes("/playlist");
	const isFavPlaylist = playlistId === favPlaylist?.id?.toString();

	const isMyPalylistPage =
		isPlaylistPage &&
		playlistId &&
		(isFavPlaylist ||
			createdPlaylists.some((pl) => pl.id.toString() === playlistId));

	const startDownload = useDownloadStore((s) => s.startDownload);
	const downloadedSongs = useDownloadStore((s) => s.downloadedSongs);
	const openLocalMusicMatchDialog = useLocalMusicMatchDialogStore(
		(s) => s.open,
	);

	const isDownloaded = downloadedSongs.some(
		(item) => item.song.id === (data as Song).id,
	);

	const artistList = (data as Song).ar;
	const artistStr =
		(data as Song).ar?.[0]?.name ||
		(data as Resource).resourceExtInfo.artists?.[0]?.name;
	const albumStr = (data as Song).al?.name;

	const { isFullscreen, toggleFullscreen } = useAppWindow();
	const navigateToDetail = (path: string) => {
		requestCloseLyricSheet();
		navigate(path);
		closeMenu();
	};

	const isLocalMusic = (data as Song).localFilePath !== undefined;

	const isLoggedin = useUserStore((s) => s.isLoggedin);

	// 列表接口返回的 Song 只带 l/m/h/sq(/hr) 字段，je/sk/db/jm 等高音质
	// 需要单独请求音质详情接口才能拿到
	const canDownload =
		isLoggedin && !isDownloaded && !isLocalMusic && type === "song";
	const [qualityDetails, setQualityDetails] = useState<
		SongQualityDetail[] | null
	>(null);
	const songId = (data as Song).id;
	useEffect(() => {
		if (!canDownload || !songId) return;
		let cancelled = false;
		getSongMusicDetail(songId)
			.then((details) => {
				if (!cancelled && details.length > 0) setQualityDetails(details);
			})
			.catch((e) => {
				console.error("获取歌曲音质详情失败:", e);
			});
		return () => {
			cancelled = true;
		};
	}, [canDownload, songId]);

	// 详情未返回前，先用歌曲对象自带的音质字段兜底
	const downloadQualities: { level: string; desc: string; size?: number }[] =
		qualityDetails ??
		QUALITY_LIST.filter(
			(q) => q.key !== "unlock" && (data as Song)[q.key as keyof Song],
		)
			.map((q) => ({ level: q.level, desc: q.desc }))
			.reverse();

	return (
		<>
			<ContextMenuButton
				id="play-music"
				icon={<Play24Filled className="size-4" />}
				content="播放"
				onClick={() => {
					closeMenu();
					handlePlay(data);
				}}
			/>

			{!isInPlaylist({
				id: (data as any).id || (data as any).resourceId,
			} as Song) && (
				<>
					<ContextMenuButton
						id="add-to-playlist"
						icon={<TextBulletListAdd24Regular className="size-4" />}
						content="加入播放列表"
						onClick={async () => {
							closeMenu();
							handleNextPlay(data);
						}}
					/>
				</>
			)}

			{isLocalMusic && (
				<>
					<ContextMenuSeperator />
					<ContextMenuButton
						id="match-local-music"
						icon={<Search24Regular className="size-4" />}
						content={
							(data as Song).localMatchedSongId
								? "重新匹配歌曲信息"
								: "匹配歌曲信息"
						}
						onClick={() => {
							closeMenu();
							openLocalMusicMatchDialog(data as Song);
						}}
					/>
				</>
			)}

			{!isLocalMusic && (
				<>
					<ContextMenuSeperator />
					<ContextMenuButton
						id="collect-music"
						icon={<Collections24Regular className="size-4" />}
						content="收藏"
						hasSubmenu={true}
					>
						{isLoggedin ? (
							collectablePlaylists.length > 0 ? (
								collectablePlaylists.map((playlist) => (
									<ContextMenuButton
										id={`collect-music-${playlist.id}`}
										key={playlist.id}
										content={playlist.name}
										onClick={() => {
											closeMenu();
											handleAddToPlaylist(playlist.id, data);
										}}
									/>
								))
							) : (
								<div className="p-2">请先创建歌单</div>
							)
						) : (
							<div className="p-2">当前仅支持登录后收藏</div>
						)}
					</ContextMenuButton>
				</>
			)}

			{isLoggedin && !isDownloaded && !isLocalMusic && type === "song" && (
				<>
					<ContextMenuButton
						id="download-music"
						icon={<ArrowDownload24Regular className="size-4" />}
						content="下载"
						hasSubmenu={true}
					>
						{downloadQualities.map((q) => (
							<ContextMenuButton
								id={`download-music-${q.level}`}
								key={q.level}
								content={
									<div className="flex items-center justify-between gap-4 w-full">
										<span>{q.desc}</span>
										{q.size ? (
											<span className="text-xs text-foreground/50">
												{(q.size / 1024 / 1024).toFixed(2)}MB
											</span>
										) : null}
									</div>
								}
								onClick={() => {
									closeMenu();
									startDownload(data as Song, q.level);
								}}
							/>
						))}
					</ContextMenuButton>
					<ContextMenuSeperator />

					<ContextMenuButton
						id="artist-info"
						icon={<Person24Regular className="size-4" />}
						content={
							<div className="flex flex-col">
								<span>前往艺人</span>
								<span className="text-xs line-clamp-1 text-foreground/50">
									{artistStr}
								</span>
							</div>
						}
						hasSubmenu={artistList.length >= 2}
						onClick={() => {
							if (isFullscreen) toggleFullscreen();
							if (artistList.length >= 2) return;

							const firstArtistId =
								(data as Song).ar?.[0]?.id ??
								(data as Resource).resourceExtInfo.artists?.[0]?.id;
							if (!firstArtistId) return;

							navigateToDetail(`/detail/artist?id=${firstArtistId}`);
						}}
					>
						{artistList.map((ar) => (
							<ContextMenuButton
								id={`artist-${ar.id}`}
								key={ar.id}
								content={ar.name}
								onClick={() => {
									if (isFullscreen) toggleFullscreen();

									console.log(`/detail/artist?id=${ar.id}`);

									navigateToDetail(`/detail/artist?id=${ar.id}`);
								}}
							/>
						))}
					</ContextMenuButton>

					{(data as Song).al && (
						<ContextMenuButton
							id="album-info"
							icon={<Album24Regular className="size-4" />}
							content={
								<div className="flex flex-col">
									<span>前往专辑</span>
									<span className="text-xs line-clamp-1 text-foreground/50">
										{albumStr}
									</span>
								</div>
							}
							onClick={() => {
								if (isFullscreen) toggleFullscreen();

								navigateToDetail(`/detail/album?id=${(data as Song).al?.id}`);
							}}
						/>
					)}
				</>
			)}

			{!isLocalMusic && isMyPalylistPage && (
				<>
					<ContextMenuSeperator />

					<ContextMenuButton
						id="remove-from-playlist"
						icon={<Delete24Regular className="size-4 text-destructive" />}
						content={<span className="text-destructive">从歌单中移除</span>}
						onClick={() => {
							closeMenu();
							if (isFavPlaylist) {
								console.log("isLikelist");
								handleLike("song", data);
							} else {
								console.log("isNotLikelist");
								handleRemoveFromPlaylist(Number(playlistId), data);
							}
						}}
					/>
				</>
			)}
		</>
	);
}
