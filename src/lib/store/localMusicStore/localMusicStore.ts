import type { LocalTrack } from "@/lib/types/localMusic";
import { create } from "zustand";
import { getLocalMusicStore } from "./localMusic.persistence";
import {
	DownloadedSongToLocalTrack,
	scanLocalMusic,
} from "@/lib/services/localMusic";
import type { Song } from "@/lib/types";
import type { DownloadedSong } from "@/lib/types/download";

interface LocalMusicState {
	tracks: LocalTrack[];
	scanDirs: string[];
	lastScanTime: number | null;
	isScanning: boolean;
	hydrated: boolean;

	loadFromCache: () => Promise<void>;
	addScanDir: (dir: string) => Promise<void>;
	removeScanDir: (dir: string) => Promise<void>;
	scanAll: () => Promise<void>;
	upsertDownloadedSong: (downloadedSong: DownloadedSong) => Promise<void>;
	upsertDownloadedSongs: (downloadedSongs: DownloadedSong[]) => Promise<void>;
	setNeteaseMatch: (filePath: string, song: Song) => Promise<void>;
	clearNeteaseMatch: (filePath: string) => Promise<void>;
	save: () => Promise<void>;
}

function mergeDownloadedTrack(
	tracks: LocalTrack[],
	downloadedSong: DownloadedSong,
) {
	const existingIndex = tracks.findIndex(
		(track) =>
			track.filePath === downloadedSong.savePath ||
			(track.source === "download" &&
				track.neteaseMatch?.songId === downloadedSong.song.id),
	);

	if (existingIndex === -1)
		return [...tracks, DownloadedSongToLocalTrack(downloadedSong)];

	// 同一条下载记录已同步过则返回原数组，调用方据此跳过写盘
	const existing = tracks[existingIndex];
	if (
		existing.source === "download" &&
		existing.filePath === downloadedSong.savePath &&
		existing.downloadInfo?.downloadedAt === downloadedSong.downloadedAt &&
		existing.neteaseMatch?.songId === downloadedSong.song.id
	) {
		return tracks;
	}

	const nextTracks = [...tracks];
	nextTracks[existingIndex] = {
		...existing,
		...DownloadedSongToLocalTrack(downloadedSong),
	};
	return nextTracks;
}

export const useLocalMusicStore = create<LocalMusicState>((set, get) => ({
	tracks: [],
	scanDirs: [],
	lastScanTime: null,
	isScanning: false,
	hydrated: false,

	loadFromCache: async () => {
		const store = await getLocalMusicStore();
		let scanDirs = await store.get<string[]>("scanDirs");
		const tracks = await store.get<LocalTrack[]>("tracks");
		const lastScanTime = await store.get<number>("lastScanTime");

		// 迁移：旧版本把封面 base64 内嵌在 store 里（几十 MB），
		// 先剥离让后续读写恢复轻量，再后台重扫一次由 Rust 端把封面落盘为图片文件
		const rawTracks = tracks ?? [];
		const hasLegacyCovers = rawTracks.some((t) => t.coverArtBase64);
		const cleanTracks = hasLegacyCovers
			? rawTracks.map(({ coverArtBase64: _legacy, ...rest }) => rest)
			: rawTracks;

		let needsSave = hasLegacyCovers;
		if (!scanDirs || scanDirs.length === 0) {
			try {
				const { getDefaultMusicDir } = await import("@/lib/services/localMusic");
				scanDirs = [await getDefaultMusicDir()];
				needsSave = true;
			} catch (e) {
				console.error("[LocalMusic] 获取默认音乐目录失败", e);
				scanDirs = scanDirs ?? [];
			}
		}

		set({
			scanDirs,
			tracks: cleanTracks,
			lastScanTime: lastScanTime ?? null,
			hydrated: true,
		});

		if (needsSave) await get().save();
		if (hasLegacyCovers) void get().scanAll();
	},

	addScanDir: async (dir: string) => {
		const { scanDirs, save, scanAll } = get();
		if (scanDirs.includes(dir)) return;

		set({ scanDirs: [...scanDirs, dir] });

		await save();
		await scanAll();
	},

	removeScanDir: async (dir: string) => {
		const { scanDirs, tracks, save } = get();
		const newDirs = scanDirs.filter((d) => d != dir);
		const newTracks = tracks.filter((t) => !t.filePath.startsWith(dir));
		set({ scanDirs: newDirs, tracks: newTracks });
		await save();
	},

	scanAll: async () => {
		const { scanDirs, save, tracks } = get();
		if (scanDirs.length === 0) return;

		set({ isScanning: true });

		try {
			const previousMatchByPath = new Map(
				tracks
					.filter((track) => track.neteaseMatch)
					.map((track) => [track.filePath, track.neteaseMatch]),
			);
			const previousDownloadInfoByPath = new Map(
				tracks
					.filter((track) => track.downloadInfo)
					.map((track) => [track.filePath, track.downloadInfo]),
			);
			const previousSourceByPath = new Map(
				tracks
					.filter((track) => track.source)
					.map((track) => [track.filePath, track.source]),
			);
			const allTracks: LocalTrack[] = [];
			for (const dir of scanDirs) {
				try {
					const dirTracks = await scanLocalMusic(dir);
					allTracks.push(
						...dirTracks.map((track) => ({
							...track,
							source: previousSourceByPath.get(track.filePath) || track.source,
							downloadInfo: previousDownloadInfoByPath.get(track.filePath),
							neteaseMatch: previousMatchByPath.get(track.filePath),
						})),
					);
				} catch (e) {
					console.error(`[LocalMusic] 扫描目录失败: ${dir}`, e);
				}
			}

			const scannedPathSet = new Set(allTracks.map((track) => track.filePath));
			allTracks.push(
				...tracks.filter(
					(track) =>
						track.source === "download" && !scannedPathSet.has(track.filePath),
				),
			);

			set({
				tracks: allTracks,
				lastScanTime: Date.now(),
				isScanning: false,
			});
			await save();
		} catch (e) {
			console.error("[LocalMusic] 扫描失败", e);
			set({ isScanning: false });
		}
	},

	upsertDownloadedSong: async (downloadedSong) => {
		if (!get().hydrated) await get().loadFromCache();

		const { tracks, save } = get();
		const nextTracks = mergeDownloadedTrack(tracks, downloadedSong);
		if (nextTracks === tracks) return;

		set({ tracks: nextTracks });
		await save();
	},

	upsertDownloadedSongs: async (downloadedSongs) => {
		if (downloadedSongs.length === 0) return;
		if (!get().hydrated) await get().loadFromCache();

		const { tracks, save } = get();
		const nextTracks = downloadedSongs.reduce(
			(currentTracks, downloadedSong) =>
				mergeDownloadedTrack(currentTracks, downloadedSong),
			tracks,
		);
		if (nextTracks === tracks) return;

		set({ tracks: nextTracks });
		await save();
	},

	setNeteaseMatch: async (filePath, song) => {
		const { tracks, save } = get();
		set({
			tracks: tracks.map((track) =>
				track.filePath === filePath
					? {
							...track,
							neteaseMatch: {
								songId: song.id,
								song,
								matchedAt: Date.now(),
							},
						}
					: track,
			),
		});
		await save();
	},

	clearNeteaseMatch: async (filePath) => {
		const { tracks, save } = get();
		set({
			tracks: tracks.map((track) => {
				if (track.filePath !== filePath) return track;
				const nextTrack = { ...track };
				delete nextTrack.neteaseMatch;
				return nextTrack;
			}),
		});
		await save();
	},

	save: async () => {
		const store = await getLocalMusicStore();
		const { scanDirs, tracks, lastScanTime } = get();
		await store.set("scanDirs", scanDirs);
		await store.set("tracks", tracks);
		await store.set("lastScanTime", lastScanTime);
		await store.save();
	},
}));

export async function initLocalMusic() {
	await useLocalMusicStore.getState().loadFromCache();
}
