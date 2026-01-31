import { api } from "../api";
import { Playlist, Privilege, Song } from "../types";

interface PlaylistDetailResponse {
  code: number;
  playlist: Playlist;
  privileges: Privilege[];
}

interface PlaylistAllTrackResponse {
  code: number;
  songs: Song[];
  privileges: Privilege[];
}

export async function getPlaylistDetail(id: string | number) {
  const res = await api.get<PlaylistDetailResponse>("/playlist/detail", {
    id: id.toString(),
  });

  if (res.code !== 200) return null;

  return { playlist: res.playlist, privilege: res.privileges };
}

export async function getPlaylistAllTrack(
  id: string | number,
  limit?: string | number,
  offset?: string | number,
) {
  const res = await api.get<PlaylistAllTrackResponse>("/playlist/track/all", {
    id: id.toString(),
    ...(limit !== undefined && { limit: limit.toString() }),
    ...(offset !== undefined && { offset: offset.toString() }),
  });

  return { songs: res.songs, privileges: res.privileges };
}
