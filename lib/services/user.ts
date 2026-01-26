import { api } from "../api";
import { Account, UserProfile, Playlist } from "../types";

interface UserDetailResponse {
  code: number;
  level: number;
  listenSongs: number;
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

interface UserUpdateParams {
  nickname?: string;
  signature?: string;
  gender?: number; // 0: 保密 1: 男性 2: 女性
  birthday?: number;
  city?: number;
  province?: number;
}

// 获取用户详情
// 登录后调用此接口 , 传入用户 id, 可以获取用户详情
export async function getUserDetails(uid: number) {
  return api.get<UserDetailResponse>('/user/detail', { uid: uid.toString() });
}

// 获取账户详情
// 登录后调用此接口 ,可获取用户账号信息
export async function getAccountDetails() {
  return api.get<AccountDetailResponse>('/user/account');
}

// 获取用户信息 , 歌单，收藏，mv, dj 数量
// 登录后调用此接口 , 可以获取用户信息
export async function getUserSubcount() {
  return api.get<UserSubcountResponse>('/user/subcount');
}

// 更新用户信息
export async function updateUserProfile(params: UserUpdateParams) {
  return api.post('/user/update', params);
}

interface UserPlaylistResponse {
  code: number;
  more: boolean;
  playlist: Playlist[];
}

// 获取用户歌单
export async function getUserPlaylists(uid: number, limit: number = 30, offset: number = 0) {
  return api.get<UserPlaylistResponse>('/user/playlist', {
    uid: uid.toString(),
    limit: limit.toString(),
    offset: offset.toString()
  });
}

