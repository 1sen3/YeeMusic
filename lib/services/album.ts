import { api } from "../api";
import { Album, AlbumSong } from "../types";

interface AlbumResponse {
  code: number;
  album: Album;
  songs: AlbumSong[];
}

export async function getAlbum(
  id: number | string,
): Promise<AlbumDetails | null> {
  const res = await api.get<AlbumResponse>("/album", { id: id.toString() });
  if (res.code === 200) {
    return {
      ...res.album,
      songs: res.songs,
    };
  }
  return null;
}
