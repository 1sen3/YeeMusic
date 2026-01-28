import { api } from "../api";
import { Album, Song } from "../types";

interface AlbumResponse {
  code: number;
  album: Album;
  songs: Song[];
}

export async function getAlbum(id: number | string): Promise<Album | null> {
  const res = await api.get<AlbumResponse>("/album", { id: id.toString() });
  if (res.code === 200) {
    return {
      ...res.album,
      songs: res.songs,
    };
  }
  return null;
}
