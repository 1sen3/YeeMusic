import { Quality, Song } from "./song";

export interface PlayerState {
  currentSong: Song | null;
  currentIndexInPlaylist: number;
  currentSongMusicDetail: {
    l?: Quality;
    h?: Quality;
    m?: Quality;
    sq?: Quality;
    hr?: Quality;
    jye?: Quality;
    sk?: Quality;
    db?: Quality;
    jm?: Quality;
  } | null;
  playlist: Song[];
  isPlaying: boolean;
  isLoadingMusic: boolean;
  musicLevel: "l" | "m" | "h" | "sq" | "hr" | "je" | "sk" | "db" | "jm";
  repeatMode: "order" | "repeat" | "single"; // 顺序、循环、单曲循环
  isShuffle: boolean; // 是否随机
  volume: number;
  progress: number; // 0 ~ 100
  duration: number; // 当前歌曲总时长 s
  currentTime: number; // 当前播放时长 s
}
