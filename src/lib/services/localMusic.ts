import { invoke } from "@tauri-apps/api/core";
import type { LocalTrack } from "../types/localMusic";
import type { Song } from "../types";
import type { DownloadedSong } from "../types/download";

export async function scanLocalMusic(dir: string): Promise<LocalTrack[]> {
	return invoke<LocalTrack[]>("scan_local_music", { dir });
}

export function DownloadedSongToLocalTrack(
	downloadedSong: DownloadedSong,
): LocalTrack {
	const { song } = downloadedSong;

	return {
		filePath: downloadedSong.savePath,
		title: song.name,
		artist: song.ar?.map((artist) => artist.name).join(" / ") || "",
		album: song.al?.name || "",
		durationSecs: (song.dt || 0) / 1000,
		coverArtBase64: null,
		source: "download",
		downloadInfo: {
			level: downloadedSong.level,
			fileType: downloadedSong.fileType,
			fileSize: downloadedSong.fileSize,
			downloadedAt: downloadedSong.downloadedAt,
		},
		neteaseMatch: {
			songId: song.id,
			song,
			matchedAt: downloadedSong.downloadedAt,
		},
	};
}

export function LocalTrackToSong(track: LocalTrack): Song {
	const matchedSong = track.neteaseMatch?.song;
	const matchedAlbum = matchedSong?.al || matchedSong?.album;
	const matchedArtists = matchedSong?.ar || matchedSong?.artists;

	return {
		id: -Math.abs(hashString(track.filePath)),
		name: matchedSong?.name || track.title,
		ar: matchedArtists?.length
			? matchedArtists
			: [{ id: 0, name: track.artist }],
		al: {
			id: matchedAlbum?.id || 0,
			name: matchedAlbum?.name || track.album,
			picUrl:
				matchedAlbum?.picUrl ||
				(track.coverArtBase64
					? `data:image/jpeg;base64,${track.coverArtBase64}`
					: undefined),
		},
		dt: track.durationSecs * 1000,
		localFilePath: track.filePath,
		localOriginalMetadata: {
			title: track.title,
			artist: track.artist,
			album: track.album,
			durationSecs: track.durationSecs,
		},
		localNeteaseMatch: track.neteaseMatch,
		localMatchedSongId: track.neteaseMatch?.songId,
	};
}

function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; ++i) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return hash;
}

export async function getDefaultMusicDir(): Promise<string> {
	return invoke<string>("get_default_music_dir");
}
