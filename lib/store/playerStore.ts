import { create } from "zustand";
import { Song } from "../types";
import { PlayerState } from "../types/player";
import {
  getSongDetail,
  getSongMusicDetail,
  getSongUrl,
} from "../services/song";
import { corePlayer } from "../player/corePlayer";
import { REPEAT_MODE_CONFIG } from "../constants/player";
import { getPlaylistAllTrack } from "../services/playlist";
import { getAlbum } from "../services/album";
import { SONG_QUALITY } from "../constants/song";

interface PlayerActions {
  playSong: (song: Song) => void;
  playList: (
    listId: string | number,
    listType: "list" | "album" | "voicelist",
  ) => void;

  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  updateProgress: () => void;
  updateVolume: (volume: number) => void;
  seek: (percentage: number) => void;
  addToPlaylist: (song: Song) => void;
  toggleRepeatMode: () => void;
  toggleShuffleMode: () => void;
  removeFromPlaylist: (song: Song) => void;
  setMusicLevel: (level: keyof typeof SONG_QUALITY) => void;
}

export const usePlayerStore = create<PlayerState & PlayerActions>(
  (set, get) => ({
    currentSong: null,
    currentIndexInPlaylist: -1,
    currentSongMusicDetail: [],
    playlist: [],
    isPlaying: false,
    isLoadingMusic: false,
    musicLevel: "sq",
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
      const { playlist, togglePlay, musicLevel } = get();

      const existingIndex = playlist.findIndex((s) => s.id === song.id);
      let targetIndex: number;

      if (existingIndex !== -1) targetIndex = existingIndex;
      else {
        targetIndex = playlist.length;
        set({ playlist: [...playlist, song] });
      }

      set({ currentSong: song, currentIndexInPlaylist: targetIndex });

      set({ isLoadingMusic: true });

      const musicDetail = await getSongMusicDetail(song.id);
      const res = await getSongUrl(
        [song.id.toString()],
        SONG_QUALITY[musicLevel].level,
      );

      if (res?.[0]?.url && musicDetail) {
        corePlayer.play(
          res[0].url,
          () => {
            get().next();
          },
          (duration) => {
            set({ isPlaying: true, duration });
          },
        );
        set({ isLoadingMusic: false, currentSongMusicDetail: musicDetail });
      }
    },

    playList: async (listId, listType) => {
      set({ isLoadingMusic: true });

      try {
        let songs;

        switch (listType) {
          case "list": {
            const res = await getPlaylistAllTrack(listId);
            songs = res?.songs;
            break;
          }
          case "album": {
            const res = await getAlbum(listId);
            songs = res?.songs;
            break;
          }
        }

        if (!songs || !songs.length) {
          set({ isLoadingMusic: false });
          return;
        }

        set({ playlist: songs });

        await get().playSong(songs[0]);
      } catch (error) {
        console.error("播放歌单失败", error);
        set({ isPlaying: false, isLoadingMusic: false });
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

    removeFromPlaylist: async (song: Song) => {
      const { playlist, currentSong, next } = get();

      const newPlaylist = playlist.filter((s) => s.id !== song.id);

      if (currentSong?.id === song.id) {
        if (newPlaylist.length === 0) {
          corePlayer.pause();
          set({
            playlist: [],
            currentSong: null,
            currentIndexInPlaylist: -1,
            isPlaying: false,
          });
          return;
        }

        set({ playlist: newPlaylist });
        next();
      } else {
        const newIdx = newPlaylist.findIndex((s) => s.id === currentSong?.id);
        set({
          playlist: newPlaylist,
          currentIndexInPlaylist: newIdx,
        });
      }
    },

    setMusicLevel: async (level: keyof typeof SONG_QUALITY) => {
      const { currentSong, musicLevel, currentTime } = get();

      if (!currentSong || level === musicLevel) {
        set({ musicLevel: level });
        return;
      }

      set({ musicLevel: level, isLoadingMusic: true });

      try {
        const res = await getSongUrl(
          [currentSong.id.toString()],
          SONG_QUALITY[level].level,
        );

        if (res?.[0]?.url) {
          corePlayer.play(
            res?.[0]?.url,
            () => get().next(),
            (duration) => {
              set({ isPlaying: true, duration, isLoadingMusic: false });
              get().seek((currentTime / duration) * 100);
            },
          );
        }
      } catch (err) {
        console.log("切换音质失败", err);
        set({ isLoadingMusic: false });
      }
    },
  }),
);
