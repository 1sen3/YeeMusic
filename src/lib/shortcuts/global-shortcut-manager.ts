import { isTauri } from "@tauri-apps/api/core";
import { toast } from "sonner";
import {
	bindingToAccelerator,
	findConflictBindings,
	SHORTCUT_ACTION_LIST,
	type ShortcutAction,
	type ShortcutBindings,
} from "@/lib/constants/shortcuts";
import { likeSong } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { useUserStore } from "@/lib/store/userStore/userStore";

const VOLUME_STEP = 0.05;

/** 与 useSongLogic.handleLike 一致的喜欢逻辑，供非 React 环境调用 */
async function toggleLikeCurrentSong() {
	const { currentSong } = usePlayerStore.getState();
	if (!currentSong) return;

	const userStore = useUserStore.getState();
	const songId = Number(currentSong.id);
	const isLiked = userStore.likeListSet.has(songId);
	const targetState = !isLiked;
	const favPlaylistId = userStore.favPlaylist?.id;

	userStore.toggleLikeMusic(songId, targetState);

	try {
		const res = await likeSong(songId, targetState);
		if (!res) {
			useUserStore.getState().toggleLikeMusic(songId, isLiked);
			toast.error("操作失败，请重试...", { position: "top-center" });
			return;
		}
		window.dispatchEvent(
			new CustomEvent(
				targetState ? "song-added-to-playlist" : "song-removed-from-playlist",
				{ detail: { playlistId: favPlaylistId, songId } },
			),
		);
	} catch (err) {
		useUserStore.getState().toggleLikeMusic(songId, isLiked);
		toast.error("操作失败，请重试...", { position: "top-center" });
		console.log("切换歌曲喜欢状态失败", err);
	}
}

export function executeShortcutAction(action: ShortcutAction) {
	const player = usePlayerStore.getState();
	switch (action) {
		case "togglePlay":
			player.togglePlay();
			break;
		case "prev":
			player.prev(true);
			break;
		case "next":
			player.next(true);
			break;
		case "volumeUp":
			player.updateVolume(Math.min(1, player.volume + VOLUME_STEP));
			break;
		case "volumeDown":
			player.updateVolume(Math.max(0, player.volume - VOLUME_STEP));
			break;
		case "toggleLike":
			toggleLikeCurrentSong();
			break;
	}
}

let suspended = false;
let syncQueue: Promise<void> = Promise.resolve();

/** 串行化注册操作，避免快速连续修改时 unregisterAll/register 交错 */
function enqueueSync(task: () => Promise<void>) {
	syncQueue = syncQueue.then(task).catch((error) => {
		console.error("同步全局快捷键失败", error);
	});
	return syncQueue;
}

async function applyBindings(bindings: ShortcutBindings) {
	const { register, unregisterAll } = await import(
		"@tauri-apps/plugin-global-shortcut"
	);

	await unregisterAll();
	if (suspended) return;

	const conflicts = findConflictBindings(bindings);
	const failed: string[] = [];

	for (const { action, label } of SHORTCUT_ACTION_LIST) {
		const binding = bindings[action];
		// 冲突的绑定不注册，与设置页的冲突提示保持一致
		if (!binding || conflicts.has(binding)) continue;

		const accelerator = bindingToAccelerator(binding);
		if (!accelerator) {
			failed.push(label);
			continue;
		}

		try {
			await register(accelerator, (event) => {
				if (event.state === "Pressed") executeShortcutAction(action);
			});
		} catch (error) {
			// 多为快捷键已被其他应用占用
			console.error(`注册全局快捷键失败：${label} (${accelerator})`, error);
			failed.push(label);
		}
	}

	if (failed.length > 0) {
		toast.error(`部分快捷键注册失败（可能已被其他应用占用）：${failed.join("、")}`, {
			position: "top-center",
		});
	}
}

export function syncGlobalShortcuts() {
	if (!isTauri()) return Promise.resolve();
	const { bindings } = useSettingStore.getState().shortcuts;
	return enqueueSync(() => applyBindings(bindings));
}

/** 录制快捷键时临时注销全部全局快捷键，避免按键被系统拦截 */
export function suspendGlobalShortcuts() {
	suspended = true;
	if (!isTauri()) return;
	enqueueSync(async () => {
		const { unregisterAll } = await import(
			"@tauri-apps/plugin-global-shortcut"
		);
		await unregisterAll();
	});
}

export function resumeGlobalShortcuts() {
	suspended = false;
	syncGlobalShortcuts();
}

/** 仅在主窗口生效：初始注册并跟随设置变化重新注册 */
export function initGlobalShortcuts() {
	if (!isTauri()) return;

	import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
		// 全局快捷键为应用级注册，避免 tray-menu 等窗口重复注册
		if (getCurrentWindow().label !== "main") return;

		syncGlobalShortcuts();
		useSettingStore.subscribe((state, prevState) => {
			if (state.shortcuts.bindings !== prevState.shortcuts.bindings) {
				syncGlobalShortcuts();
			}
		});
	});
}
