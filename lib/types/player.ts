import { Song } from "./song";

export interface PlayerState {
  currentSong: Song | null;
  currentIndexInPlaylist: number;
  playlist: Song[];
  isPlaying: boolean;
  repeatMode: "order" | "repeat" | "single"; // 顺序、循环、单曲循环
  isShuffle: boolean; // 是否随机
  volume: number;
  progress: number; // 0 ~ 100
  duration: number; // 当前歌曲总时长 s
  currentTime: number; // 当前播放时长 s
}
