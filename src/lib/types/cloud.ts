import type { Song } from "./song";

/** /user/cloud 返回的云盘歌曲条目 */
export interface CloudSongItem {
	simpleSong: Song; // 歌曲详情，未匹配公开歌曲(t=1)时大部分字段可能为空
	songId: number;
	songName: string;
	artist: string; // 文件元数据解析出的歌手名
	album: string; // 文件元数据解析出的专辑名
	fileName: string; // 上传的原始文件名
	fileSize: number; // 字节
	bitrate: number; // 码率 kbps
	addTime: number; // 上传时间，毫秒时间戳
	cover: number;
	coverId: string;
	lyricId: string;
	version: number;
}

export interface CloudUploadTask {
	id: string;
	fileName: string;
	status: "pending" | "uploading" | "done" | "error";
	uploaded: number; // 已上传字节
	total: number; // 总字节
	speed: number; // 字节/秒
	errorMsg?: string;
	addedAt: number;
}
