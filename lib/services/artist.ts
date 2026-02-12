import { api } from "../api";
import { Album, Artist, ArtistIntroduction, Song } from "../types";
import { getSongDetail } from "./song";

interface ArtistDetailResponse {
  code: number;
  message: string;
  data: {
    artist: Artist;
  };
}

interface ArtistTopSongsResponse {
  code: number;
  more: boolean;
  songs: Song[];
}

interface ArtistAllSongsResponse {
  code: number;
  more: boolean;
  total: number;
  songs: Song[];
}

interface ArtistAlbumsResponse {
  code: number;
  artist: Artist;
  hotAlbums: Album[];
  more: boolean;
}

interface ArtistDescResponse {
  introduction: ArtistIntroduction[];
  count: number;
  briefDesc: string;
  code: number;
}

interface ArtistSimilarResponse {
  code: number;
  artists: Artist[];
}

export function getArtistDetail(id: string) {
  return api
    .get<ArtistDetailResponse>("/artist/detail", { id })
    .then((res) => res.data.artist);
}

export function getArtistTopSongs(id: string) {
  return api.get<ArtistTopSongsResponse>("/artist/top/song", { id });
}

interface ArtistAllSongsParams {
  id: string;
  order?: "hot" | "time";
  limit?: number;
  offset?: number;
}

export async function getArtistAllSongs({
  id,
  order = "hot",
  limit = 50,
  offset = 0,
}: ArtistAllSongsParams) {
  const res = await api.get<ArtistAllSongsResponse>("/artist/songs", {
    id,
    order,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const songIds = res.songs.map((song) => song.id.toString());

  const songDetails = await getSongDetail(songIds);

  return { ...res, songDetails };
}

interface ArtistAlbumsParams {
  id: string;
  limit?: number;
  offset?: number;
}

export async function getArtistAlbums({
  id,
  limit = 30,
  offset = 0,
}: ArtistAlbumsParams) {
  return await api.get<ArtistAlbumsResponse>("/artist/album", {
    id,
    limit: limit.toString(),
    offset: offset.toString(),
  });
}

export async function getArtistDesc(id: string) {
  return await api.get<ArtistDescResponse>("/artist/desc", { id });
}

export async function getArtistSimilar(id: string) {
  const res = await api.get<ArtistSimilarResponse>("/simi/artist", { id });
  console.log(res);
  return res;
}
