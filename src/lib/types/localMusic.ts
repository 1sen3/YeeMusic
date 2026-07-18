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
	/** 封面图片在封面缓存目录中的文件路径 */
	coverArtPath?: string | null;
	/** @deprecated 旧版内嵌 base64 封面，仅在读取旧缓存迁移时出现 */
	coverArtBase64?: string | null;
	source?: "scan" | "download";
	downloadInfo?: LocalTrackDownloadInfo;
	neteaseMatch?: LocalTrackNeteaseMatch;
}
