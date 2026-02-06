import { api } from "../api";
import { Album, Artist, Playlist, Song } from "../types";
import { getSongDetail } from "./song";

interface SearchDefalutResponse {
  code: number;
  data: {
    showKeyword: string;
    realkeyword: string;
  };
}

interface SearchSuggestAllMatch {
  keyword: string;
}

interface SearchSuggestResponse {
  code: number;
  result: {
    allMatch: SearchSuggestAllMatch[];
  };
}

interface SearchResponse {
  code: number;
  result: {
    songs?: Song[];
    songCount?: number;
    albums?: Album[];
    albumCount?: number;
    artists?: Artist[];
    artistCount?: number;
    playlists?: Playlist[];
    playlistCount?: number;
  };
}

export async function getSearchDefault() {
  const res = await api.get<SearchDefalutResponse>("/search/default");
  return res.data;
}

export async function getSearchSuggest(keywords: string) {
  const res = await api.get<SearchSuggestResponse>("/search/suggest", {
    keywords,
    type: "mobile",
  });

  if (!res.result.allMatch) return [];
  return res.result.allMatch.map((item) => item.keyword);
}

export interface SearchParams {
  keywords: string;
  limit?: number;
  offset?: number;
  // 1: 单曲 10: 专辑 100: 歌手 1000: 歌单 1002: 用户 1004: MV
  // 1006: 歌词 1009: 电台 1014: 视频 1018: 综合 2000: 声音
  type?: 1 | 10 | 100 | 1000 | 1002 | 1004 | 1006 | 1009 | 1014 | 1018 | 2000;
}

export async function getSearchResult({
  keywords,
  limit = 30,
  offset = 0,
  type = 1,
}: SearchParams) {
  const res = await api.get<SearchResponse>("/cloudsearch", {
    keywords,
    limit: limit?.toString(),
    offset: offset?.toString(),
    type: type?.toString(),
  });

  return res.result;
}
