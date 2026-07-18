import { Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { PlaylistPage } from "@/components/playlist/detail/playlist-page";
import { PlaylistSkeleton } from "@/components/skeleton/playlist-skeleton";
import { useSongLogic } from "@/hooks/use-song-logic";
import {
	getPlaylistAllTrack,
	getPlaylistDetail,
	updateSongOrder,
} from "@/lib/services/playlist";
import { useUserStore } from "@/lib/store/userStore/userStore";
import type { Song } from "@/lib/types";

function PlaylistContent() {
	const [searchParams] = useSearchParams();
	const id = searchParams.get("id");

	const user = useUserStore((s) => s.user);
	const { handleGetSongDetail } = useSongLogic();

	// SWR 缓存：返回导航时即时命中，不再重新请求
	const { data: detail, isLoading: isPlaylistLoading } = useSWR(
		id ? (["playlist", id] as const) : null,
		([, pid]) => getPlaylistDetail(pid),
		{ revalidateOnFocus: false },
	);
	const playlist = detail?.playlist ?? null;

	const {
		data: songs,
		isLoading: isSongsLoading,
		mutate: mutateSongs,
	} = useSWR<Song[]>(
		id ? (["playlist-tracks", id] as const) : null,
		([, pid]: readonly [string, string]) => getPlaylistAllTrack(pid),
		{ revalidateOnFocus: false },
	);

	// 歌曲增删事件直接更新 SWR 缓存，不触发整表重新请求
	useEffect(() => {
		if (!id) return;

		const handleSongRemoved = (e: Event) => {
			const { playlistId: removedPid, songId } = (e as CustomEvent).detail;
			if (removedPid.toString() === id.toString()) {
				mutateSongs((prev) => prev?.filter((s) => s.id !== songId), {
					revalidate: false,
				});
			}
		};
		const handleSongAdded = async (e: Event) => {
			const { playlistId: addedPid, songId } = (e as CustomEvent).detail;
			if (addedPid?.toString() === id.toString()) {
				const newSong = await handleGetSongDetail(Number(songId));
				if (newSong) {
					mutateSongs((prev) => (prev ? [newSong, ...prev] : [newSong]), {
						revalidate: false,
					});
				}
			}
		};

		window.addEventListener("song-removed-from-playlist", handleSongRemoved);
		window.addEventListener("song-added-to-playlist", handleSongAdded);

		return () => {
			window.removeEventListener(
				"song-removed-from-playlist",
				handleSongRemoved,
			);
			window.removeEventListener("song-added-to-playlist", handleSongAdded);
		};
	}, [id, mutateSongs, handleGetSongDetail]);

	async function handleReorderSongs(from: number, to: number) {
		if (!id || from === to) return;
		const prevSongs = songs ?? [];
		if (
			from < 0 ||
			to < 0 ||
			from >= prevSongs.length ||
			to >= prevSongs.length
		)
			return;

		const nextSongs = [...prevSongs];
		const [moved] = nextSongs.splice(from, 1);
		nextSongs.splice(to, 0, moved);
		mutateSongs(nextSongs, { revalidate: false });

		try {
			const ok = await updateSongOrder(
				id,
				nextSongs.map((s) => s.id),
			);
			if (!ok) throw new Error("接口返回失败");
		} catch (err) {
			console.error("调整歌曲顺序失败", err);
			mutateSongs(prevSongs, { revalidate: false });
			toast.error("调整歌曲顺序失败，请重试", { position: "top-center" });
		}
	}

	if (!id) return <div className="p-8">未找到歌单 ID</div>;

	if (isPlaylistLoading || !playlist) {
		return <PlaylistSkeleton />;
	}

	return (
		<div className="w-full h-full py-8 flex flex-col gap-8">
			<PlaylistPage
				playlist={playlist}
				songs={songs ?? []}
				isSongsLoading={isSongsLoading}
				isMyPlaylist={playlist.creator.userId === user?.userId}
				onRefresh={() => {}}
				onReorderSongs={handleReorderSongs}
			/>
		</div>
	);
}

export default function PlaylistDetailPage() {
	return (
		<Suspense fallback={<PlaylistSkeleton />}>
			<PlaylistContent />
		</Suspense>
	);
}
