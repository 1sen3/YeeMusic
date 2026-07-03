import type { StateCreator } from "zustand";
import { QUALITY_BY_KEY, type QualityKey } from "@/lib/constants/song";
import { corePlayer } from "@/lib/player/corePlayer";
import { getSongUrl } from "@/lib/services/song";
import type { SharedPlayerState, SongInfoSlice } from "@/lib/types/player";

function getSongDurationSeconds(song: SharedPlayerState["currentSong"]) {
	if (!song) return 0;

	const localDuration = song.localOriginalMetadata?.durationSecs ?? 0;
	if (localDuration > 0) return localDuration;

	if (song.dt > 0) return song.dt / 1000;

	const duration = song.duration ?? 0;
	if (duration <= 0) return 0;

	return duration > 10000 ? duration / 1000 : duration;
}

let qualityChangeRequestId = 0;
let qualityChangeAbortController: AbortController | null = null;

export const createSongInfoSlice: StateCreator<
	SharedPlayerState,
	[],
	[],
	SongInfoSlice
> = (set, get) => ({
	currentSong: null,
	currentSongMusicDetail: [],
	currentSongLyrics: null,
	currentMusicLevelKey: "sq",

	setCurrentMusicLevelKey: (key: QualityKey) => {
		const { currentSong, currentMusicLevelKey, currentTime } = get();

		if (!currentSong || key === currentMusicLevelKey) {
			set({ currentMusicLevelKey: key });
			return;
		}

		qualityChangeRequestId += 1;
		const requestId = qualityChangeRequestId;
		qualityChangeAbortController?.abort();
		qualityChangeAbortController = new AbortController();
		const { signal } = qualityChangeAbortController;
		const songId = currentSong.id;
		const isActiveRequest = () =>
			!signal.aborted &&
			requestId === qualityChangeRequestId &&
			get().currentSong?.id === songId;

		set({ currentMusicLevelKey: key, isLoadingMusic: true });

		window.setTimeout(async () => {
			try {
				const res = await getSongUrl(
					[songId.toString()],
					QUALITY_BY_KEY[key].level,
					false,
					signal,
				);

				if (!isActiveRequest()) return;

				const url = res?.[0]?.url;
				if (!url) {
					set({ isLoadingMusic: false });
					return;
				}

				corePlayer.play(
					url,
					() => get().next(),
					(duration) => {
						if (!isActiveRequest()) return;
						set({ isPlaying: true, duration, isLoadingMusic: false });
						if (duration > 0) {
							get().seek((currentTime / duration) * 100);
						}
					},
					(currentTime) => {
						if (!isActiveRequest()) return;
						const { duration } = get();
						const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
						set({ currentTime, progress });
					},
					() => {
						if (!isActiveRequest()) return;
						set({ isLoadingMusic: false });
					},
					getSongDurationSeconds(currentSong),
				);
				corePlayer.setVolume(get().volume);
			} catch (err) {
				if (!isActiveRequest()) return;
				console.log("切换音质失败", err);
				set({ isLoadingMusic: false });
			}
		}, 0);
	},
});
