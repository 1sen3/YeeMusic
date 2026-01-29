import { create } from "zustand";
import { Song } from "../types";
import { PlayerState } from "../types/player";
import { getSongUrl } from "../services/song";
import { corePlayer } from "../player/corePlayer";
import { REPEAT_MODE_CONFIG } from "../constants/player";

interface PlayerActions {
  playSong: (song: Song) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  updateProgress: () => void;
  updateVolume: (volume: number) => void;
  seek: (percentage: number) => void;
  addToPlaylist: (song: Song) => void;
  toggleRepeatMode: () => void;
  toggleShuffleMode: () => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>(
  (set, get) => ({
    currentSong: null,
    currentIndexInPlaylist: -1,
    playlist: [],
    isPlaying: false,
    isLoadingMusic: false,
    repeatMode: "order",
    isShuffle: false,
    volume: 0.7,
    progress: 0,
    duration: 0,
    currentTime: 0,

    addToPlaylist: (song) => {
      const { playlist } = get();
      set({ playlist: [...playlist, song] });
    },

    playSong: async (song) => {
      const { playlist, isPlaying, togglePlay } = get();

      if (isPlaying) togglePlay();

      const existingIndex = playlist.findIndex((s) => s.id === song.id);
      let targetIndex: number;

      if (existingIndex !== -1) targetIndex = existingIndex;
      else {
        targetIndex = playlist.length;
        set({ playlist: [...playlist, song] });
      }

      set({ currentSong: song, currentIndexInPlaylist: targetIndex });

      set({ isLoadingMusic: true });

      const res = await getSongUrl([song.id.toString()], "standard");

      if (res?.[0]?.url) {
        corePlayer.play(
          res[0].url,
          () => {
            get().next();
          },
          (duration) => {
            set({ isPlaying: true, duration });
          },
        );
        set({ isLoadingMusic: false });
        togglePlay();
      }
    },

    togglePlay: () => {
      const { isPlaying, currentSong } = get();
      if (!currentSong) return;

      if (isPlaying) corePlayer.pause();
      else corePlayer.resume();

      set({ isPlaying: !isPlaying });
    },

    next: () => {
      const {
        togglePlay,
        currentIndexInPlaylist,
        playlist,
        currentSong,
        repeatMode,
        isShuffle,
      } = get();
      if (!currentSong || playlist.length === 0) return;

      let nextIdx: number;
      // 随机播放
      if (isShuffle) {
        nextIdx = Math.floor(Math.random() * playlist.length);
        if (playlist.length > 1 && nextIdx === currentIndexInPlaylist) {
          nextIdx = (nextIdx + 1) % playlist.length;
        }
      }
      // 单曲循环
      else if (repeatMode === "single") {
        nextIdx = currentIndexInPlaylist;
      }
      // 顺序或循环
      else {
        nextIdx = currentIndexInPlaylist + 1;
        // 顺序播放时，最后一首播完就暂停
        if (nextIdx >= playlist.length) {
          nextIdx = 0;
          if (repeatMode === "order") {
            set({ currentIndexInPlaylist: 0 });
            togglePlay();
            return;
          }
        }
      }

      set({ currentIndexInPlaylist: nextIdx });
      get().playSong(playlist[nextIdx]);
    },

    prev: () => {
      const {
        currentIndexInPlaylist,
        playlist,
        currentSong,
        repeatMode,
        isShuffle,
      } = get();
      if (!currentSong || playlist.length === 0) return;

      let prevIdx: number;
      // 随机播放
      if (isShuffle) {
        prevIdx = Math.floor(Math.random() * playlist.length);
        if (playlist.length > 1 && prevIdx === currentIndexInPlaylist) {
          prevIdx = (prevIdx - 1 + playlist.length) % playlist.length;
        }
      }
      // 单曲循环
      else if (repeatMode === "single") {
        prevIdx = currentIndexInPlaylist;
      }
      // 顺序或循环
      else {
        prevIdx = currentIndexInPlaylist - 1;
        if (prevIdx < 0) {
          prevIdx = playlist.length - 1;
          if (repeatMode === "order") {
            prevIdx = 0;
          }
        }
      }

      set({ currentIndexInPlaylist: prevIdx });
      get().playSong(playlist[prevIdx]);
    },

    updateProgress: () => {
      const currentTime = corePlayer.getPosition();
      const { duration } = get();
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
      set({ currentTime, progress });
    },

    updateVolume: (volume: number) => {
      corePlayer.setVolume(volume);
      set({ volume });
    },

    seek: (percentage: number) => {
      corePlayer.seek(percentage / 100);
      get().updateProgress();
    },

    toggleRepeatMode: () => {
      const { repeatMode, isShuffle } = get();

      const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
      const nextRepetMode = repeatModeConfig.next;
      if (!REPEAT_MODE_CONFIG[nextRepetMode].canShuffle && isShuffle) {
        set({ isShuffle: false });
      }
      set({ repeatMode: nextRepetMode });
    },

    toggleShuffleMode: () => {
      const { isShuffle } = get();
      set({ isShuffle: !isShuffle });
    },
  }),
);
