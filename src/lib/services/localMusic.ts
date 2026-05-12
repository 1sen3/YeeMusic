import { invoke } from "@tauri-apps/api/core";
import { LocalTrack } from "../types/localMusic";
import { Song } from "../types";

export async function scanLocalMusic(dir: string): Promise<LocalTrack[]> {
  return invoke<LocalTrack[]>("scan_local_music", { dir });
}

export function LocalTrackToSong(track: LocalTrack): Song {
  return {
    id: -Math.abs(hashString(track.filePath)),
    name: track.title,
    ar: [{ id: 0, name: track.artist }],
    al: {
      id: 0,
      name: track.album,
      picUrl: track.coverArtBase64
        ? `data:image/jpeg;base64,${track.coverArtBase64}`
        : undefined,
    },
    dt: track.durationSecs * 1000,
    localFilePath: track.filePath,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; ++i) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

export async function getDefaultMusicDir(): Promise<string> {
  return invoke<string>("get_default_music_dir");
}
