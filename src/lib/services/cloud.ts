import { api, getApiBaseUrl } from "../api";
import type { CloudSongItem, Song } from "../types";

interface UserCloudResponse {
	code: number;
	count: number; // 云盘歌曲总数
	size: string; // 已用容量，字节字符串
	maxSize: string; // 总容量，字节字符串
	upgradeSign: number;
	hasMore: boolean;
	data: CloudSongItem[];
}

export interface CloudData {
	songs: Song[];
	items: CloudSongItem[];
	count: number;
	size: number; // 已用容量，字节
	maxSize: number; // 总容量，字节
}

// 获取云盘歌曲列表
// 登录后调用此接口，可获取云盘数据，歌曲播放地址需另行调用 /song/url 获取。
export async function getUserCloud(limit: number = 200, offset: number = 0) {
	return api.get<UserCloudResponse>("/user/cloud", {
		limit: limit.toString(),
		offset: offset.toString(),
	});
}

// 云盘条目转 Song
// 未匹配公开歌曲(t=1)时 simpleSong 的名称、歌手、专辑可能为空，回退到文件元数据。
export function cloudItemToSong(item: CloudSongItem): Song {
	const simple = item.simpleSong ?? ({} as Song);
	const hasArtist = !!simple.ar?.some((a) => a?.name);

	return {
		...simple,
		id: simple.id ?? item.songId,
		name: simple.name || item.songName || item.fileName,
		dt: simple.dt ?? 0,
		ar: hasArtist ? simple.ar : [{ id: 0, name: item.artist || "未知歌手" }],
		al: simple.al?.name
			? simple.al
			: {
					id: simple.al?.id ?? 0,
					name: item.album || "未知专辑",
					picUrl: simple.al?.picUrl,
				},
	};
}

// 分页拉取全部云盘歌曲
export async function getUserCloudAll(): Promise<CloudData> {
	const pageSize = 200;
	const items: CloudSongItem[] = [];
	let offset = 0;
	let count = 0;
	let size = 0;
	let maxSize = 0;

	while (true) {
		const res = await getUserCloud(pageSize, offset);
		if (res.code !== 200) throw new Error("获取云盘歌曲失败");

		items.push(...(res.data ?? []));
		count = res.count;
		size = Number(res.size) || 0;
		maxSize = Number(res.maxSize) || 0;

		if (!res.hasMore || !res.data?.length) break;
		offset += pageSize;
	}

	return { songs: items.map(cloudItemToSong), items, count, size, maxSize };
}

// 删除云盘歌曲，id 可多个
export async function deleteCloudSong(ids: (number | string)[]) {
	const res = await api.get<{ code: number }>("/user/cloud/del", {
		id: ids.join(","),
	});
	return res.code === 200;
}

interface CloudUploadToken {
	needUpload: boolean;
	songId: string | number;
	uploadToken: string;
	objectKey: string;
	resourceId: string | number;
	uploadUrl: string;
	md5: string;
}

interface CloudUploadTokenResponse {
	code: number;
	msg?: string;
	data?: CloudUploadToken;
}

interface CloudUploadCompleteResponse {
	code: number;
	msg?: string;
	data?: { songId?: string | number };
}

function createAbortError() {
	return new DOMException("上传已取消", "AbortError");
}

// 分块计算文件 MD5，避免大文件整块读入内存
async function computeFileMd5(
	file: File,
	signal: AbortSignal,
): Promise<string> {
	const { default: SparkMD5 } = await import("spark-md5");
	const chunkSize = 2 * 1024 * 1024;
	const spark = new SparkMD5.ArrayBuffer();

	for (let start = 0; start < file.size; start += chunkSize) {
		if (signal.aborted) throw createAbortError();
		const chunk = await file.slice(start, start + chunkSize).arrayBuffer();
		spark.append(chunk);
	}
	return spark.end();
}

// 解析音频标签作为云盘歌曲元数据，失败不阻断上传（服务端会回退到文件名/未知歌手）
async function parseAudioTags(
	file: File,
): Promise<{ title?: string; artist?: string; album?: string }> {
	try {
		const { parseBlob } = await import("music-metadata");
		const { common } = await parseBlob(file, {
			skipCovers: true,
			duration: false,
		});
		return { title: common.title, artist: common.artist, album: common.album };
	} catch {
		return {};
	}
}

// 文件直传网易云存储(NOS)，使用 XMLHttpRequest 以获取上传进度
function uploadToNos(
	file: File,
	token: CloudUploadToken,
	onProgress: ((uploaded: number, total: number) => void) | undefined,
	onXhr: (xhr: XMLHttpRequest) => void,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		onXhr(xhr);
		xhr.open("POST", token.uploadUrl);
		xhr.setRequestHeader("x-nos-token", token.uploadToken);
		xhr.setRequestHeader("Content-MD5", token.md5);
		xhr.setRequestHeader("Content-Type", "audio/mpeg");
		xhr.upload.onprogress = (e) => {
			if (e.lengthComputable) onProgress?.(e.loaded, e.total);
		};
		xhr.onload = () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve();
			} else {
				reject(new Error(`上传到云存储失败（${xhr.status}）`));
			}
		};
		xhr.onerror = () => reject(new Error("网络错误，上传失败"));
		xhr.onabort = () => reject(createAbortError());
		xhr.send(file);
	});
}

// 上传歌曲到云盘（客户端直传模式）
// 服务端代理模式(POST /cloud)受 serverless 请求体大小限制，
// 走 api-enhanced 推荐的直传流程：/cloud/upload/token 取凭证 →
// 文件直传 NOS → /cloud/upload/complete 归档，文件本体不经过 API 服务器。
export function uploadCloudSong(
	file: File,
	onProgress?: (uploaded: number, total: number) => void,
): { promise: Promise<CloudUploadCompleteResponse>; abort: () => void } {
	const controller = new AbortController();
	let nosXhr: XMLHttpRequest | null = null;

	const run = async (): Promise<CloudUploadCompleteResponse> => {
		if (!getApiBaseUrl()) {
			throw new Error("API 服务地址未配置（VITE_API_BASE_URL）");
		}

		const tags = await parseAudioTags(file);
		const md5 = await computeFileMd5(file, controller.signal);

		const tokenRes = await api.post<CloudUploadTokenResponse>(
			"/cloud/upload/token",
			{ md5, fileSize: file.size, filename: file.name },
			{ signal: controller.signal },
		);
		const token = tokenRes.data;
		if (tokenRes.code !== 200 || !token) {
			throw new Error(tokenRes.msg || "获取上传凭证失败");
		}

		// 云端已存在相同文件(秒传)时跳过传输，直接归档
		if (token.needUpload) {
			await uploadToNos(file, token, onProgress, (xhr) => {
				nosXhr = xhr;
			});
			if (controller.signal.aborted) throw createAbortError();
		} else {
			onProgress?.(file.size, file.size);
		}

		const completeRes = await api.post<CloudUploadCompleteResponse>(
			"/cloud/upload/complete",
			{
				songId: token.songId,
				resourceId: token.resourceId,
				md5,
				filename: file.name,
				song: tags.title,
				artist: tags.artist,
				album: tags.album,
			},
			{ signal: controller.signal },
		);
		if (completeRes.code !== 200) {
			throw new Error(completeRes.msg || "导入云盘失败");
		}
		return completeRes;
	};

	return {
		promise: run(),
		abort: () => {
			controller.abort();
			nosXhr?.abort();
		},
	};
}
