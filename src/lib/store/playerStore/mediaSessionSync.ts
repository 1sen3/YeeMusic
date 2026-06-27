import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { usePlayerStore } from "./playerStore";
import { shallow } from "zustand/shallow";

interface NativeAudioSnapshot {
	isReady: boolean;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
}

function syncNativeSnapshot(snapshot: NativeAudioSnapshot) {
	const progress =
		snapshot.duration > 0
			? (snapshot.currentTime / snapshot.duration) * 100
			: 0;

	usePlayerStore.setState({
		isPlaying: snapshot.isPlaying,
		duration: snapshot.duration,
		currentTime: snapshot.currentTime,
		progress,
	});
}

async function playNativeOrCurrentSong() {
	const store = usePlayerStore.getState();
	if (!store.currentSong) return;

	const snapshot = await invoke<NativeAudioSnapshot>("player_get_state");
	if (!snapshot.isReady) {
		store.playSong(store.currentSong, store.isFmMode);
		return;
	}

	syncNativeSnapshot(await invoke<NativeAudioSnapshot>("player_play"));
}

async function pauseNative() {
	syncNativeSnapshot(await invoke<NativeAudioSnapshot>("player_pause"));
}

async function seekNative(positionSecs: number) {
	syncNativeSnapshot(
		await invoke<NativeAudioSnapshot>("player_seek", { positionSecs }),
	);
}

export function initMediaSession() {
	const unsubscribes: Array<() => void> = [];

	// 歌曲信息订阅
	const unsubMetadata = usePlayerStore.subscribe(
		(state) => ({ currentSong: state.currentSong, isPlaying: state.isPlaying }),
		({ currentSong, isPlaying }) => {
			if (!currentSong) return;

			// 设置元数据
			invoke("smtc_update_metadata", {
				title: currentSong.name || "",
				artist: currentSong.ar?.map((a) => a.name).join("、") || "",
				album: currentSong.al?.name || "",
				coverUrl: currentSong.al?.picUrl
					? `${currentSong.al.picUrl}?param=512y512`
					: "",
				durationSecs: 0,
			}).catch((e) => console.error("Update SMTC Info Failed:", e));

			emit("sync-player-state", {
				title: currentSong.name || "Yee Music",
				artist: currentSong.ar?.map((a) => a.name).join("、") || "未播放",
				coverUrl: currentSong.al?.picUrl
					? `${currentSong.al.picUrl}?param=128y128`
					: "",
				isPlaying,
			}).catch(console.error);
		},
		{ equalityFn: shallow },
	);
	unsubscribes.push(unsubMetadata);

	// 播放状态订阅
	const unsubPlayback = usePlayerStore.subscribe(
		(state) => ({
			isPlaying: state.isPlaying,
			duration: state.duration,
		}),
		({ isPlaying, duration }) => {
			const time = usePlayerStore.getState().currentTime;

			invoke("smtc_update_playback", {
				isPlaying,
				positionSecs: time,
				durationSecs: duration,
			}).catch(console.error);
		},
		{ equalityFn: shallow },
	);
	unsubscribes.push(unsubPlayback);

	// 播放模式订阅
	const unsubPlaymode = usePlayerStore.subscribe(
		(state) => ({
			isShuffle: state.isShuffle,
			repeatMode: state.repeatMode,
		}),
		({ isShuffle, repeatMode }) => {
			emit("sync-play-mode", {
				isShuffle,
				repeatMode,
			}).catch(console.error);
		},
		{ equalityFn: shallow },
	);
	unsubscribes.push(unsubPlaymode);

	// Tauri 事件监听
	const listenPromise = listen<{ event: string; position?: number }>(
		"smtc-event",
		(e) => {
			const { event, position } = e.payload;
			const store = usePlayerStore.getState();

			switch (event) {
				case "play":
					if (!store.isPlaying) {
						playNativeOrCurrentSong().catch(console.error);
					}
					break;
				case "pause":
					if (store.isPlaying) {
						pauseNative().catch(console.error);
					}
					break;
				case "toggle":
					if (store.isPlaying) {
						pauseNative().catch(console.error);
					} else {
						playNativeOrCurrentSong().catch(console.error);
					}
					break;
				case "next":
					store.next();
					break;
				case "previous":
					store.prev();
					break;
				case "set_position":
					if (position !== undefined && store.duration > 0) {
						seekNative(position).catch(console.error);
					}
					break;
				case "shuffle":
					store.toggleShuffleMode();
					break;
				case "repeat":
					store.toggleRepeatMode();
					break;
			}
		},
	);

	return () => {
		unsubscribes.forEach((unsub) => unsub());
		listenPromise.then((unlisten) => unlisten());
	};
}
