import { api } from "../api";
import { Song } from "../types";
import { getSongDetail } from "./song";

interface DailyRecommendResponse {
	code: number;
	data: {
		fromCache: boolean;
		dailySongs: Song[];
	};
}

interface PersonalFmResponse {
	code: number;
	data: Song[];
}

let dailyRecommendCache: {
	timestamp: number;
	data: Song[];
} | null = null;

const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 hours

export async function getDailyRecommend() {
	const now = Date.now();
	if (
		dailyRecommendCache &&
		now - dailyRecommendCache.timestamp < CACHE_DURATION
	) {
		return dailyRecommendCache.data;
	}

	const res = await api.get<DailyRecommendResponse>("/recommend/songs");

	if (res.code !== 200) return [];

	dailyRecommendCache = {
		timestamp: now,
		data: res.data.dailySongs,
	};

	return res.data.dailySongs;
}

export async function getPersonalFm() {
	const res = await api.get<PersonalFmResponse>("/personal_fm");

	if (res.code !== 200) return [];

	const ids = res.data.map((s) => s.id);
	const songs = await getSongDetail(ids);
	return songs;
}

export async function fmTrash(id: string | number) {
	const res = await api.get<{ code: number }>("/fm_trash", {
		id: id.toString(),
	});

	return res.code === 200;
}
