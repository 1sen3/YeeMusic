import { useSearchParams } from "react-router-dom";
import { PlaylistPage } from "@/components/playlist/detail/playlist-page";
import {
	getPlaylistAllTrack,
	getPlaylistDetail,
} from "@/lib/services/playlist";
import { Playlist, Song } from "@/lib/types";
import { useEffect, useState, Suspense } from "react";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { useSongLogic } from "@/hooks/use-song-logic";
import { PlaylistSkeleton } from "@/components/skeleton/playlist-skeleton";

function PlaylistContent() {
	const [searchParams] = useSearchParams();
	const id = searchParams.get("id");

	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [songs, setSongs] = useState<Song[]>([]);
	const [isPlaylistLoading, setIsPlaylistLoading] = useState(false);
	const [isSongsLoading, setIsSongsLoading] = useState(false);
	const user = useUserStore((s) => s.user);
	const { handleGetSongDetail } = useSongLogic();

	useEffect(() => {
		if (!id) return;

		let cancelled = false;

		setPlaylist(null);
		setSongs([]);
		setIsPlaylistLoading(true);
		setIsSongsLoading(true);

		getPlaylistDetail(id)
			.then((res) => {
				if (cancelled) return;
				setPlaylist(res.playlist);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setIsPlaylistLoading(false);
			});

		getPlaylistAllTrack(id)
			.then((tracksRes) => {
				if (cancelled) return;
				setSongs(tracksRes);
			})
			.catch((err) => {
				if (!cancelled) console.error(err);
			})
			.finally(() => {
				if (!cancelled) setIsSongsLoading(false);
			});

		const handleSongRemoved = (e: Event) => {
			const customEvent = e as CustomEvent;
			const { playlistId: removedPid, songId } = customEvent.detail;

			if (removedPid.toString() === id?.toString()) {
				setSongs((prev) => prev.filter((s) => s.id !== songId));
			}
		};
		const handleSongAdded = async (e: Event) => {
			const customEvent = e as CustomEvent;
			const { playlistId: addedPid, songId } = customEvent.detail;

			if (addedPid?.toString() === id?.toString()) {
				const newSong = await handleGetSongDetail(Number(songId));
				if (newSong) {
					setSongs((prev) => [newSong, ...prev]);
				}
			}
		};

		window.addEventListener("song-removed-from-playlist", handleSongRemoved);
		window.addEventListener("song-added-to-playlist", handleSongAdded);

		return () => {
			cancelled = true;
			window.removeEventListener(
				"song-removed-from-playlist",
				handleSongRemoved,
			);
			window.removeEventListener("song-added-to-playlist", handleSongAdded);
		};
	}, [id]);

	if (!id) return <div className="p-8">未找到歌单 ID</div>;

	if (isPlaylistLoading || !playlist) {
		return <PlaylistSkeleton />;
	}

	return (
		<div className="w-full h-full py-8 flex flex-col gap-8">
			<PlaylistPage
				playlist={playlist}
				songs={songs}
				isSongsLoading={isSongsLoading}
				isMyPlaylist={playlist.creator.userId === user?.userId}
				onRefresh={() => {}}
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
