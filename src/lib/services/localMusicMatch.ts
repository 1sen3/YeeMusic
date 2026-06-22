import { getSearchResult } from "./search";
import type { Song } from "../types";

interface MatchApiSong extends Song {
  artists?: Song["ar"];
  album?: Song["al"];
  duration?: number;
}

export interface MatchLocalMusicParams {
  title: string;
  album: string;
  artist: string;
  duration: number;
}

export async function matchLocalMusic(params: MatchLocalMusicParams) {
  const keywordsList = [
    [params.title, params.artist],
    [params.title, params.album],
    [params.title],
  ]
    .map((parts) => parts.map((item) => item.trim()).filter(Boolean).join(" "))
    .filter(Boolean)
    .filter((keywords, index, list) => list.indexOf(keywords) === index);

  if (keywordsList.length === 0) return [];

  const songs = new Map<number, Song>();

  for (const keywords of keywordsList) {
    const result = await getSearchResult({
      keywords,
      limit: 30,
      type: 1,
    });

    for (const song of result.songs ?? []) {
      songs.set(song.id, normalizeMatchedSong(song));
    }

    if (songs.size > 0) break;
  }

  return rankLocalMusicCandidates([...songs.values()], params);
}

function normalizeMatchedSong(song: MatchApiSong): Song {
  const ar = song.ar || song.artists || [];
  const al = song.al || song.album || { id: 0, name: "", picUrl: undefined };

  return {
    ...song,
    ar,
    al,
    dt: song.dt || song.duration || 0,
  };
}

function rankLocalMusicCandidates(songs: Song[], params: MatchLocalMusicParams) {
  return songs
    .map((song, index) => ({
      song,
      score: scoreSong(song, params) - index * 0.001,
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ song }) => song);
}

function scoreSong(song: Song, params: MatchLocalMusicParams) {
  const titleScore = textSimilarity(song.name, params.title);
  const artistScore = textSimilarity(
    song.ar?.map((artist) => artist.name).join(" ") ?? "",
    params.artist,
  );
  const albumScore = textSimilarity(song.al?.name ?? "", params.album);
  const durationScore = scoreDuration((song.dt || 0) / 1000, params.duration);

  return (
    titleScore * 0.46 +
    artistScore * 0.28 +
    albumScore * 0.1 +
    durationScore * 0.16
  );
}

function textSimilarity(candidate: string, target: string) {
  const normalizedCandidate = normalizeText(candidate);
  const normalizedTarget = normalizeText(target);

  if (!normalizedCandidate || !normalizedTarget) return 0;
  if (normalizedCandidate === normalizedTarget) return 1;
  if (
    normalizedCandidate.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedCandidate)
  ) {
    return 0.82;
  }

  const candidateTokens = tokenize(normalizedCandidate);
  const targetTokens = tokenize(normalizedTarget);
  if (candidateTokens.length === 0 || targetTokens.length === 0) return 0;

  const candidateSet = new Set(candidateTokens);
  const overlap = targetTokens.filter((token) => candidateSet.has(token)).length;

  return overlap / Math.max(candidateTokens.length, targetTokens.length);
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]|【[^】]*】/g, " ")
    .replace(/[’'".,，。:：;；!?！？、/\\|_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeText(text).split(" ").filter(Boolean);
}

function scoreDuration(candidateDuration: number, targetDuration: number) {
  if (!candidateDuration || !targetDuration) return 0;

  const delta = Math.abs(candidateDuration - targetDuration);
  if (delta <= 2) return 1;
  if (delta <= 5) return 0.82;
  if (delta <= 10) return 0.55;
  if (delta <= 20) return 0.25;
  return 0;
}
