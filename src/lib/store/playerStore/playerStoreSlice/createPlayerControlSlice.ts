import { invoke } from "@tauri-apps/api/core";
import type { StateCreator } from "zustand";
import { REPEAT_MODE_BY_TYPE } from "@/lib/constants/player";
import {
	needsDowngrade,
	QUALITY_BY_KEY,
	QUALITY_BY_LEVEL,
	type QualityKey,
} from "@/lib/constants/song";
import { corePlayer } from "@/lib/player/corePlayer";
import { getAlbum } from "@/lib/services/album";
import { getArtistAllSongs } from "@/lib/services/artist";
import { getPlaylistAllTrack } from "@/lib/services/playlist";
import { fmTrash, getPersonalFm } from "@/lib/services/recommend";
import {
	getSongLyric,
	getSongMusicDetail,
	getSongUrl,
	unblockMusic,
} from "@/lib/services/song";
import type { Song } from "@/lib/types";
import type { PlayerControlSlice, SharedPlayerState } from "@/lib/types/player";
import { useSettingStore } from "../../settingStore/settingStore";

let currentPlayAbortController: AbortController | null = null;
const UNBLOCK_SOURCE_PREFIX = "unblock:";
const NEXT_SONG_PRELOAD_LEAD_SECONDS = 10;

function toUnblockSource(url: string) {
	return `${UNBLOCK_SOURCE_PREFIX}${url}`;
}

function getSongDurationSeconds(song: Song) {
	const localDuration = song.localOriginalMetadata?.durationSecs ?? 0;
	if (localDuration > 0) return localDuration;

	if (song.dt > 0) return song.dt / 1000;

	const duration = song.duration ?? 0;
	if (duration <= 0) return 0;

	return duration > 10000 ? duration / 1000 : duration;
}

async function resolvePreloadUrl(song: Song, signal: AbortSignal) {
	if (song.localFilePath) return song.localFilePath;

	const preferMusicLevel = useSettingStore.getState().audio.preferQuality;
	let url: string | undefined;

	const canPlay = song.privilege
		? song.privilege.st >= 0 && song.privilege.pl > 0
		: true;

	if (canPlay) {
		const knownMaxKey =
			song.privilege?.maxBrLevel &&
			QUALITY_BY_LEVEL[
				song.privilege.maxBrLevel as keyof typeof QUALITY_BY_LEVEL
			]?.key;

		let targetQuality: QualityKey = preferMusicLevel;
		if (knownMaxKey && needsDowngrade(targetQuality, knownMaxKey)) {
			targetQuality = knownMaxKey;
		}

		const res = await getSongUrl(
			[song.id.toString()],
			QUALITY_BY_KEY[targetQuality].level,
			false,
			signal,
		);
		url = res?.[0]?.url;

		if (url) {
			const actualKey =
				QUALITY_BY_LEVEL[res[0].level as keyof typeof QUALITY_BY_LEVEL]?.key ??
				targetQuality;

			const cachedPath = await invoke<string | null>("check_audio_cache", {
				songId: song.id,
				level: actualKey,
				url,
			});
			return cachedPath ?? url;
		}
	}

	const unblockRes = await unblockMusic(song.id, signal);
	return unblockRes?.data ? toUnblockSource(unblockRes.data) : undefined;
}

function getPredictableNextSong(state: SharedPlayerState) {
	if (state.isFmMode)
		return state.fmRepeatMode ? undefined : state.fmPlaylist[1];
	if (state.repeatMode === "single" || state.isShuffle === "on")
		return undefined;

	const nextIndex = state.currentIndexInPlaylist + 1;
	if (nextIndex < state.playlist.length) return state.playlist[nextIndex];
	if (state.repeatMode === "repeat" && state.playlist.length > 0) {
		return state.playlist[0];
	}
	return undefined;
}

function preloadNextSong(get: () => SharedPlayerState, signal: AbortSignal) {
	const nextSong = getPredictableNextSong(get());
	if (!nextSong) return false;

	resolvePreloadUrl(nextSong, signal)
		.then((url) => {
			if (!signal.aborted && url) corePlayer.preload(url);
		})
		.catch((error) => {
			if (!signal.aborted) {
				console.debug("[PLAYER] Preload next song skipped:", error);
			}
		});

	return true;
}

function canStartNaturalCrossfade(state: SharedPlayerState) {
	if (state.isFmMode) return !state.fmRepeatMode && state.fmPlaylist.length > 1;
	if (state.repeatMode === "single") return false;
	if (state.isShuffle === "on") return state.playlist.length > 1;
	if (state.currentIndexInPlaylist + 1 < state.playlist.length) return true;
	return state.repeatMode === "repeat" && state.playlist.length > 0;
}

function shouldStartNaturalCrossfade(
	state: SharedPlayerState,
	currentTime: number,
	duration: number,
) {
	const crossfadeDuration = corePlayer.getCrossfadeDuration();
	if (crossfadeDuration <= 0 || duration <= 0) return false;
	if (!canStartNaturalCrossfade(state)) return false;

	const remaining = duration - currentTime;
	return remaining > 0 && remaining <= Math.min(crossfadeDuration, duration);
}

function shouldPreloadNextSong(
	state: SharedPlayerState,
	currentTime: number,
	duration: number,
) {
	if (duration <= 0 || !getPredictableNextSong(state)) return false;

	const remaining = duration - currentTime;
	return (
		remaining > 0 &&
		remaining <= Math.min(NEXT_SONG_PRELOAD_LEAD_SECONDS, duration)
	);
}

export const createPlayerControlSlice: StateCreator<
	SharedPlayerState,
	[],
	[],
	PlayerControlSlice
> = (set, get) => ({
	isPlaying: false,
	isLoadingMusic: false,
	repeatMode: "order",
	isShuffle: "off",
	volume: 0.7,
	progress: 0,
	duration: 0,
	currentTime: 0,

	playSong: async (song, isFm = false) => {
		if (!isFm) {
			set({ isFmMode: false });
		}

		if (currentPlayAbortController) currentPlayAbortController.abort();
		currentPlayAbortController = new AbortController();

		const { signal } = currentPlayAbortController;
		let naturalCrossfadeStarted = false;
		let nextSongPreloadStarted = false;
		const updatePlaybackProgress = (currentTime: number) => {
			if (signal.aborted) return;

			const state = get();
			const { duration } = state;
			const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
			set({ currentTime, progress });

			if (
				!nextSongPreloadStarted &&
				shouldPreloadNextSong(state, currentTime, duration)
			) {
				nextSongPreloadStarted = preloadNextSong(get, signal);
			}

			if (
				!naturalCrossfadeStarted &&
				shouldStartNaturalCrossfade(state, currentTime, duration)
			) {
				naturalCrossfadeStarted = true;
				get().next();
			}
		};

		try {
			const { playlist } = get();
			const preferMusicLevel = useSettingStore.getState().audio.preferQuality;
			const fallbackDuration = getSongDurationSeconds(song);

			const existingIndex = playlist.findIndex((s) => s.id === song.id);
			let targetIndex: number;

			if (existingIndex !== -1) targetIndex = existingIndex;
			else {
				targetIndex = playlist.length;
				set({ playlist: [...playlist, song] });
			}

			set({ currentSong: song, currentIndexInPlaylist: targetIndex });

			set({
				isLoadingMusic: true,
				isPlaying: false,
				currentTime: 0,
				progress: 0,
			});

			// 本地歌曲
			if (song.localFilePath) {
				const url = song.localFilePath;
				const matchedSongId = song.localMatchedSongId;

				corePlayer.play(
					url,
					() => get().next(),
					(duration) => {
						set({ isPlaying: true, duration });
					},
					updatePlaybackProgress,
					() => {
						console.error("本地歌曲播放错误");
						set({ isPlaying: false });
						get().next();
					},
					fallbackDuration,
				);

				corePlayer.setVolume(get().volume);

				set({
					isLoadingMusic: false,
					currentSongMusicDetail: undefined,
					currentSongLyrics: null,
					currentMusicLevelKey: "local",
				});

				if (matchedSongId) {
					getSongLyric(matchedSongId, signal)
						.then((musicLyric) => {
							if (!signal.aborted) set({ currentSongLyrics: musicLyric });
						})
						.catch((err) => {
							if (!signal.aborted) {
								console.error("获取本地匹配歌词失败:", err);
							}
						});
				}

				return;
			}

			// 先检查歌曲是否可用
			let url: string | undefined;
			const canPlay = song.privilege
				? song.privilege.st >= 0 && song.privilege.pl > 0
				: true; // 默认尝试当做可用处理

			if (canPlay) {
				const knownMaxKey =
					song.privilege?.maxBrLevel &&
					QUALITY_BY_LEVEL[
						song.privilege.maxBrLevel as keyof typeof QUALITY_BY_LEVEL
					]?.key;

				let targetQuality: QualityKey = preferMusicLevel;
				if (knownMaxKey && needsDowngrade(targetQuality, knownMaxKey)) {
					targetQuality = knownMaxKey;
				}

				const res = await getSongUrl(
					[song.id.toString()],
					QUALITY_BY_KEY[targetQuality].level,
					false,
					signal,
				);
				url = res?.[0]?.url;

				if (url) {
					const actualKey =
						QUALITY_BY_LEVEL[res[0].level as keyof typeof QUALITY_BY_LEVEL]
							?.key ?? targetQuality;
					set({ currentMusicLevelKey: actualKey });

					try {
						const cachedPath = await invoke<string | null>(
							"check_audio_cache",
							{
								songId: song.id,
								level: actualKey,
								url,
							},
						);

						if (cachedPath) {
							console.log("[CACHE] 使用本地缓存音频:", cachedPath);
							url = cachedPath;
						} else {
							// 触发后台下载缓存
							invoke("cache_audio", {
								songId: song.id,
								level: actualKey,
								url,
							}).catch((e) => console.error("[CACHE] 后台缓存音频失败:", e));
						}
					} catch (e) {
						console.error("[CACHE] 检查缓存状态失败:", e);
					}
				}
			}

			if (!url) {
				// 尝试解锁灰色歌曲，或弥补普通请求失败的歌曲
				try {
					const unblockRes = await unblockMusic(song.id, signal);
					url = unblockRes?.data ? toUnblockSource(unblockRes.data) : undefined;
					if (url) {
						set({ currentMusicLevelKey: "unlock" });
					}
				} catch (e) {
					console.error("尝试解锁歌曲出错", e);
				}
			}

			const musicDetail = await getSongMusicDetail(song.id, signal);

			// 获取歌词信息
			const musicLyric = await getSongLyric(song.id, signal);
			set({ currentSongLyrics: musicLyric });

			if (url && musicDetail) {
				corePlayer.play(
					url,
					() => {
						get().next();
					},
					(duration) => {
						set({ isPlaying: true, duration });
					},
					updatePlaybackProgress,
					async () => {
						console.error("远程歌曲播放错误，尝试恢复");
						const currentTime = get().currentTime;
						const { currentSong, currentMusicLevelKey } = get();

						if (currentSong && currentMusicLevelKey) {
							// 如果是 URL 过期，且这时候后台已经缓存好了，我们可以无缝切换到缓存
							try {
								const cachedPath = await invoke<string | null>(
									"check_audio_cache",
									{
										songId: currentSong.id,
										level: currentMusicLevelKey,
										url: url || "", // 这时候真实的 url 可能已经不可用，但可以用来提取后缀
									},
								);

								if (cachedPath) {
									console.log(
										"[CACHE] 发现已缓存文件，从缓存恢复播放:",
										cachedPath,
									);
									corePlayer.play(
										cachedPath,
										() => get().next(),
										(duration) => {
											if (duration > 0) {
												corePlayer.seek(currentTime / duration);
											}
											set({ isPlaying: true, duration });
										},
										updatePlaybackProgress,
										() => {
											console.error("缓存歌曲恢复播放仍然失败，跳过");
											set({ isPlaying: false });
											get().next();
										},
										fallbackDuration,
									);
									return; // 恢复成功，不再执行下面逻辑
								}
							} catch (e) {
								console.error("尝试从缓存恢复播放失败", e);
							}
						}

						set({ isPlaying: false });
						get().next();
					},
					fallbackDuration,
				);
				corePlayer.setVolume(get().volume);

				set({
					isLoadingMusic: false,
					currentSongMusicDetail: musicDetail,
				});
			}
		} catch (err: unknown) {
			if (err instanceof Error && err.name === "AbortError") {
				console.log("播放被中断");
				return;
			}
			console.error("播放歌曲失败:", err);
			set({ isLoadingMusic: false });
		}
	},

	playQueue: async (songs: Song[]) => {
		set({
			isLoadingMusic: true,
			playlist: songs,
			currentIndexInPlaylist: 0,
			isFmMode: false,
		});
		await get().playSong(songs[0]);
	},

	playList: async (listId, listType) => {
		set({ isLoadingMusic: true, isFmMode: false });

		try {
			let songs: Song[] | undefined;

			switch (listType) {
				case "list": {
					const res = await getPlaylistAllTrack(listId);
					songs = res;
					break;
				}
				case "album": {
					const res = await getAlbum(listId);
					songs = res?.songs;
					break;
				}
			}

			if (!songs || !songs.length) {
				set({ isLoadingMusic: false });
				return;
			}

			set({ playlist: songs });

			await get().playSong(songs[0]);
		} catch (error) {
			console.error("播放歌单失败", error);
			set({ isPlaying: false, isLoadingMusic: false });
		}
	},

	playArtist: async (artistId) => {
		set({ isLoadingMusic: true });
		try {
			const music = await getArtistAllSongs({ id: artistId });
			const songs = music.songDetails;

			if (!songs || !songs.length) {
				set({ isLoadingMusic: false });
				return;
			}

			set({ playlist: songs });
			await get().playSong(songs[0]);
		} catch (err) {
			console.error("从歌手详情播放失败", err);
			set({ isPlaying: false, isLoadingMusic: false });
		}
	},

	togglePlay: () => {
		const { isPlaying, currentSong, playSong, isFmMode } = get();
		if (!currentSong) return;

		if (!corePlayer.isReady()) {
			playSong(currentSong, isFmMode);
			return;
		}

		if (isPlaying) corePlayer.pause();
		else corePlayer.resume();

		set({ isPlaying: !isPlaying });
	},

	next: (isManual = false) => {
		if (get().isFmMode) {
			get().nextFmSong();
			return;
		}

		const {
			togglePlay,
			currentIndexInPlaylist,
			playlist,
			currentSong,
			repeatMode,
			isShuffle,
		} = get();
		if (!currentSong || playlist.length === 0) return;

		console.log(
			`[PLAYER] 当前播放歌曲在列表中的顺序: ${currentIndexInPlaylist}`,
		);

		// 单曲循环
		if (repeatMode === "single" && !isManual) {
			corePlayer.seek(0);
			corePlayer.resume();
			set({ isPlaying: true });
			return;
		}

		let nextIdx: number;
		// 随机播放
		if (isShuffle === "on") {
			nextIdx = Math.floor(Math.random() * playlist.length);
			if (playlist.length > 1 && nextIdx === currentIndexInPlaylist) {
				nextIdx = (nextIdx + 1) % playlist.length;
			}
		}
		// 顺序或循环
		else {
			console.log(
				`[PLAYER] 当前播放歌曲在列表中的顺序: ${currentIndexInPlaylist}`,
			);
			nextIdx = currentIndexInPlaylist + 1;
			console.log(
				`[PLAYER] 当前播放歌曲在列表中的顺序: ${currentIndexInPlaylist}`,
			);
			// 顺序播放时，最后一首播完就暂停
			if (nextIdx >= playlist.length) {
				nextIdx = 0;
				if (repeatMode === "order") {
					set({ currentIndexInPlaylist: 0 });
					togglePlay();
					return;
				}
			}
		}

		set({ currentIndexInPlaylist: nextIdx });
		get().playSong(playlist[nextIdx]);
	},

	prev: (isManual = false) => {
		if (get().isFmMode) {
			get().seek(0);
			return;
		}

		const {
			currentIndexInPlaylist,
			playlist,
			currentSong,
			repeatMode,
			isShuffle,
		} = get();
		if (!currentSong || playlist.length === 0) return;

		// 单曲循环
		if (repeatMode === "single" && !isManual) {
			corePlayer.seek(0);
			corePlayer.resume();
			set({ isPlaying: true });
			return;
		}

		let prevIdx: number;
		// 随机播放
		if (isShuffle === "on") {
			prevIdx = Math.floor(Math.random() * playlist.length);
			if (playlist.length > 1 && prevIdx === currentIndexInPlaylist) {
				prevIdx = (prevIdx - 1 + playlist.length) % playlist.length;
			}
		}
		// 顺序或循环
		else {
			prevIdx = currentIndexInPlaylist - 1;
			if (prevIdx < 0) {
				prevIdx = playlist.length - 1;
				if (repeatMode === "order") {
					prevIdx = 0;
				}
			}
		}

		set({ currentIndexInPlaylist: prevIdx });
		get().playSong(playlist[prevIdx]);
	},

	updateProgress: () => {
		const currentTime = corePlayer.getPosition();
		const { duration } = get();
		const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
		set({ currentTime, progress });
	},

	updateVolume: (volume: number) => {
		corePlayer.setVolume(volume);
		set({ volume });
	},

	seek: (percentage: number) => {
		if (get().duration <= 0) return;
		corePlayer.seek(percentage / 100);
		get().updateProgress();
	},

	toggleRepeatMode: () => {
		const { repeatMode, isShuffle } = get();

		const repeatModeConfig = REPEAT_MODE_BY_TYPE[repeatMode];
		const nextRepetMode = repeatModeConfig.next;
		if (!REPEAT_MODE_BY_TYPE[nextRepetMode].canShuffle && isShuffle === "on") {
			set({ isShuffle: "off" });
		}
		set({ repeatMode: nextRepetMode });
	},

	toggleShuffleMode: () => {
		const { isShuffle } = get();
		set({ isShuffle: isShuffle === "on" ? "off" : "on" });
	},

	isFmMode: false,
	fmRepeatMode: false,

	toggleFmRepeatMode: async () => {
		const { fmRepeatMode } = get();
		set({ fmRepeatMode: !fmRepeatMode });
	},

	fetchFmSongs: async () => {
		const res = await getPersonalFm();
		if (res && res.length > 0) {
			set({ fmPlaylist: [...get().fmPlaylist, ...res] });
		}
	},

	playFm: async () => {
		const { fmPlaylist, fetchFmSongs, playSong } = get();

		if (fmPlaylist.length === 0) await fetchFmSongs();

		const currentFmSongs = get().fmPlaylist;
		if (currentFmSongs.length > 0) {
			set({ isFmMode: true });
			playSong(currentFmSongs[0], true);
		}
	},

	nextFmSong: () => {
		set({ isFmMode: true });
		const { fmPlaylist, fmRepeatMode, playSong, fetchFmSongs } = get();

		if (fmRepeatMode) {
			corePlayer.seek(0);
			corePlayer.resume();
			set({ isPlaying: true });
			return;
		}

		const newFmPlaylist = fmPlaylist.slice(1);
		set({ fmPlaylist: newFmPlaylist });

		if (newFmPlaylist.length > 0) {
			playSong(newFmPlaylist[0], true);
		}

		if (newFmPlaylist.length <= 1) {
			fetchFmSongs();
		}
	},

	trashFmSong: async () => {
		const { currentSong, nextFmSong } = get();
		if (!currentSong) return;

		try {
			await fmTrash(currentSong.id);
			nextFmSong();
		} catch (error) {
			console.error("垃圾桶操作失败", error);
		}
	},
});
