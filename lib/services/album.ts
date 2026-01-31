import { api } from "../api";
import { Album, Song } from "../types";

interface AlbumResponse {
  code: number;
  album: Album;
  songs: Song[];
}

export async function getAlbum(id: number | string): Promise<Album | null> {
  const res = await api.get<AlbumResponse>("/album", { id: id.toString() });

  const albumPicUrl = res.album.picUrl;

  const songsWithCover = res.songs.map((song) => ({
    ...song,
    al: {
      ...song.al,
      picUrl: albumPicUrl,
    },
  }));

  return {
    ...res.album,
    songs: songsWithCover,
  };
}
