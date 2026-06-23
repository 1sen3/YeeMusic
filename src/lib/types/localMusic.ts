import type { Song } from "./song";

export interface LocalTrackNeteaseMatch {
	songId: number;
	song: Song;
	matchedAt: number;
}

export interface LocalTrackDownloadInfo {
	level: string;
	fileType: string;
	fileSize: number;
	downloadedAt: number;
}

export interface LocalTrack {
	filePath: string;
	title: string;
	artist: string;
	album: string;
	durationSecs: number;
	coverArtBase64: string | null;
	source?: "scan" | "download";
	downloadInfo?: LocalTrackDownloadInfo;
	neteaseMatch?: LocalTrackNeteaseMatch;
}
