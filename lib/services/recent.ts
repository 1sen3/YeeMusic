import { api } from "../api";
import { Album, Playlist, Song } from "../types";

export interface RecentData<T> {
  resourceId: string;
  playTime: number;
  resourceType: string;
  data: T;
  banned: boolean;
  multiTerminalInfo: {
    icon: string;
    os: string;
    osText: string;
  };
}

export type RecentSongData = RecentData<Song>;
export type RecentPlaylistData = RecentData<Playlist>;
export type RecentAlbumData = RecentData<Album>;

interface RecentResponse<T> {
  code: number;
  data: {
    total: number;
    list: RecentData<T>[];
  };
}

export async function getRecentSong(limit: number | string = 100) {
  return await api.get<RecentResponse<Song>>("/record/recent/song", {
    limit: limit.toString(),
  });
}

export async function getRecentPlaylist(limit: number | string = 100) {
  return await api.get<RecentResponse<Playlist>>("/record/recent/playlist", {
    limit: limit.toString(),
  });
}

export async function getRecentAlbum(limit: number | string = 100) {
  return await api.get<RecentResponse<Album>>("/record/recent/album", {
    limit: limit.toString(),
  });
}
