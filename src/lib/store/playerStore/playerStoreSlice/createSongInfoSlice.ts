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

	setCurrentMusicLevelKey: async (key: QualityKey) => {
		const { currentSong, currentMusicLevelKey, currentTime } = get();

		if (!currentSong || key === currentMusicLevelKey) {
			set({ currentMusicLevelKey: key });
			return;
		}

		set({ currentMusicLevelKey: key, isLoadingMusic: true });

		try {
			const res = await getSongUrl(
				[currentSong.id.toString()],
				QUALITY_BY_KEY[key].level,
			);

			if (res?.[0]?.url) {
				corePlayer.play(
					res?.[0]?.url,
					() => get().next(),
					(duration) => {
						set({ isPlaying: true, duration, isLoadingMusic: false });
						if (duration > 0) {
							get().seek((currentTime / duration) * 100);
						}
					},
					(currentTime) => {
						const { duration } = get();
						const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
						set({ currentTime, progress });
					},
					undefined,
					getSongDurationSeconds(currentSong),
				);
				corePlayer.setVolume(get().volume);
			}
		} catch (err) {
			console.log("切换音质失败", err);
			set({ isLoadingMusic: false });
		}
	},
});
