import { api } from "../api";
import type { Account, Album, Artist, Playlist, UserProfile } from "../types";

interface UserDetailResponse {
	code: number;
	level: number;
	listenSongs: number;
	createDays: number;
	profile: UserProfile;
}

interface AccountDetailResponse {
	code: number;
	account: Account;
	profile: UserProfile;
}

interface UserSubcountResponse {
	code: number;
	programCount: number;
	djRadioCount: number;
	mvCount: number;
	artistCount: number;
	createDjRadioCount: number;
	createdPlaylistCount: number;
	subPlaylistCount: number;
}

export interface UserUpdateParams {
	nickname: string;
	signature: string;
	gender: number; // 0: 保密 1: 男性 2: 女性
	birthday: number; // unix timestamp (ms)
	province: number;
	city: number;
}

interface LikeListResponse {
	code: number;
	checkPoint: number;
	ids: number[];
}

interface LikeArtistResponse {
	data: Artist[];
	hasMore: boolean;
	count: number;
	code: number;
}

interface LikeAlbumResponse {
	data: Album[];
	hasMore: boolean;
	count: number;
	code: number;
}

interface UserPlaylistResponse {
	code: number;
	more: boolean;
	playlist: Playlist[];
}

// 获取用户详情
// 登录后调用此接口，传入用户 id，可以获取用户详情。
export async function getUserDetails(uid: number) {
	return api.get<UserDetailResponse>("/user/detail", { uid: uid.toString() });
}

// 获取账户详情
// 登录后调用此接口，可获取用户账号信息。
export async function getAccountDetails() {
	return api.get<AccountDetailResponse>("/user/account");
}

// 获取用户信息：歌单、收藏、mv、dj 数量。
export async function getUserSubcount() {
	return api.get<UserSubcountResponse>("/user/subcount");
}

// 更新用户信息
// 接口要求 gender/birthday/nickname/province/city/signature 全部必传，
// 未修改的字段需要回传当前值。
export async function updateUserProfile(params: UserUpdateParams) {
	const res = await api.get<{ code: number }>("/user/update", {
		nickname: params.nickname,
		signature: params.signature,
		gender: params.gender.toString(),
		birthday: params.birthday.toString(),
		province: params.province.toString(),
		city: params.city.toString(),
	});

	return res.code === 200;
}

// 更新头像
// 上传裁剪后的方形图片，formData 字段名为 imgFile。
export async function updateUserAvatar(file: File, imgSize: number = 300) {
	const formData = new FormData();
	formData.append("imgFile", file);

	const params = {
		imgSize: imgSize.toString(),
		imgX: "0",
		imgY: "0",
	};

	const res = await api.post<{ code: number; data?: { url?: string } }>(
		"/avatar/upload",
		formData,
		{
			params,
		},
	);

	return res.code === 200;
}

// 获取用户喜欢歌曲 id 列表。
export async function getUserLikeList(uid: number | string) {
	return api.get<LikeListResponse>("/likelist", { uid: uid.toString() });
}

// 喜欢音乐。
export async function likeSong(id: number | string, like: boolean = true) {
	const res = await api.get<{ code: number }>("/like", {
		id: id.toString(),
		like: like.toString(),
	});

	if (res.code !== 200) return false;

	return true;
}

export async function getUserLikeArtists(limit: number = 25) {
	return api.get<LikeArtistResponse>("/artist/sublist", {
		limit: limit.toString(),
	});
}

// 收藏/取消收藏歌手。
export async function subArtist(id: number | string, t: number) {
	const res = await api.get<{ code: number }>("/artist/sub", {
		id: id.toString(),
		t: t.toString(),
	});

	if (res.code !== 200) return false;

	return true;
}

export async function getUserLikeAlbums(
	limit: number = 25,
	offset: number = 0,
) {
	const res = await api.get<LikeAlbumResponse>("/album/sub", {
		limit: limit.toString(),
		offset: offset.toString(),
	});

	return res;
}

export async function subAlbum(id: number | string, t: number) {
	const res = await api.get<{ code: number }>("/album/sub", {
		id: id.toString(),
		t: t.toString(),
	});

	if (res.code !== 200) return false;

	return true;
}

export async function getUserPlaylists(
	uid: string | number,
	limit: string | number = 30,
	offset: string | number = 0,
) {
	return api.get<UserPlaylistResponse>("/user/playlist", {
		uid: uid.toString(),
		limit: limit.toString(),
		offset: offset.toString(),
	});
}
