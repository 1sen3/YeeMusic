import { Song } from "./song";

export interface DownloadTask {
	songId: number;
	song: Song;
	level: string;
	status: "pending" | "downloading" | "paused" | "done" | "error";
	downloaded: number; // 已下载字节
	total: number; // 总字节
	speed: number; // 字节/秒
	savePath: string;
	addedAt: number;
}

export interface DownloadedSong {
	song: Song;

	br: number; // 码率 bps
	level: string; // 音质
	fileType: string; // 文件格式
	sr: number; // 采样率 hz
	md5: string; // 文件 MD5

	savePath: string; // 完整本地路径
	fileSize: number; // 字节
	downloadedAt: number; // Date.now()
}
