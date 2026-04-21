import { StateCreator } from "zustand";
import { PlayerControlSlice, SharedPlayerState } from "@/lib/types/player";
import {
  getSongLyric,
  getSongMusicDetail,
  getSongUrl,
  unblockMusic,
} from "@/lib/services/song";
import {
  needsDowngrade,
  QUALITY_BY_KEY,
  QUALITY_BY_LEVEL,
  QualityKey,
} from "@/lib/constants/song";
import { corePlayer } from "@/lib/player/corePlayer";
import { getPlaylistAllTrack } from "@/lib/services/playlist";
import { getAlbum } from "@/lib/services/album";
import { getArtistAllSongs } from "@/lib/services/artist";
import { REPEAT_MODE_CONFIG } from "@/lib/constants/player";
import { Song } from "@/lib/types";
import { fmTrash, getPersonalFm } from "@/lib/services/recommend";
import { useSettingStore } from "../settingStore";

let currentPlayAbortController: AbortController | null = null;

export const createPlayerControlSlice: StateCreator<
  SharedPlayerState,
  [],
  [],
  PlayerControlSlice
> = (set, get) => ({
  isPlaying: false,
  isLoadingMusic: false,
  repeatMode: "order",
  isShuffle: false,
  volume: 0.7,
  progress: 0,
  duration: 0,
  currentTime: 0,

  playSong: async (song, isFm = false) => {
    if (!isFm) {
      set({ isFmMode: false });
    }

    if (currentPlayAbortController) currentPlayAbortController.abort();
    currentPlayAbortController = new AbortController();

    const { signal } = currentPlayAbortController;

    try {
      const { playlist } = get();
      const preferMusicLevel = useSettingStore.getState().audio.preferQuality;

      const existingIndex = playlist.findIndex((s) => s.id === song.id);
      let targetIndex: number;

      if (existingIndex !== -1) targetIndex = existingIndex;
      else {
        targetIndex = playlist.length;
        set({ playlist: [...playlist, song] });
      }

      set({ currentSong: song, currentIndexInPlaylist: targetIndex });

      set({ isLoadingMusic: true, currentTime: 0, progress: 0 });

      // 先检查歌曲是否可用
      let url;
      const canPlay = song.privilege
        ? song.privilege.st >= 0 && song.privilege.pl > 0
        : true; // 默认尝试当做可用处理

      if (canPlay) {
        const knownMaxKey =
          song.privilege?.maxBrLevel &&
          QUALITY_BY_LEVEL[
            song.privilege.maxBrLevel as keyof typeof QUALITY_BY_LEVEL
          ]?.key;

        let targetQuality: QualityKey = preferMusicLevel;
        if (knownMaxKey && needsDowngrade(targetQuality, knownMaxKey)) {
          targetQuality = knownMaxKey;
        }

        const res = await getSongUrl(
          [song.id.toString()],
          QUALITY_BY_KEY[targetQuality].level,
          false,
          signal,
        );
        url = res?.[0]?.url;

        if (url) {
          const actualKey =
            QUALITY_BY_LEVEL[res[0].level as keyof typeof QUALITY_BY_LEVEL]
              ?.key ?? targetQuality;
          set({ currentMusicLevelKey: actualKey });
        }
      }

      if (!url) {
        // 尝试解锁灰色歌曲，或弥补普通请求失败的歌曲
        try {
          const unblockRes = await unblockMusic(song.id, signal);
          url = unblockRes?.data;
          if (url) {
            set({ currentMusicLevelKey: "unlock" });
          }
        } catch (e) {
          console.error("尝试解锁歌曲出错", e);
        }
      }

      const musicDetail = await getSongMusicDetail(song.id, signal);

      // 获取歌词信息
      const musicLyric = await getSongLyric(song.id, signal);
      set({ currentSongLyrics: musicLyric });

      if (url && musicDetail) {
        corePlayer.play(
          url,
          () => {
            get().next();
          },
          (duration) => {
            set({ isPlaying: true, duration });
          },
          (currentTime) => {
            const { duration } = get();
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            set({ currentTime, progress });
          },
        );
        corePlayer.setVolume(get().volume);

        set({
          isLoadingMusic: false,
          currentSongMusicDetail: musicDetail,
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("播放被中断");
        return;
      }
      console.error("播放歌曲失败:", err);
      set({ isLoadingMusic: false });
    } finally {
      console.log(
        `[PLAYER] 当前播放的歌曲音质：${QUALITY_BY_KEY[get().currentMusicLevelKey].desc}`,
      );
    }
  },

  playQueue: async (songs: Song[]) => {
    set({
      isLoadingMusic: true,
      playlist: songs,
      currentIndexInPlaylist: 0,
      isFmMode: false,
    });
    await get().playSong(songs[0]);
  },

  playList: async (listId, listType) => {
    set({ isLoadingMusic: true, isFmMode: false });

    try {
      let songs;

      switch (listType) {
        case "list": {
          const res = await getPlaylistAllTrack(listId);
          songs = res;
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

  playArtist: async (artistId) => {
    set({ isLoadingMusic: true });
    try {
      const music = await getArtistAllSongs({ id: artistId });
      const songs = music.songDetails;

      if (!songs || !songs.length) {
        set({ isLoadingMusic: false });
        return;
      }

      set({ playlist: songs });
      await get().playSong(songs[0]);
    } catch (err) {
      console.error("从歌手详情播放失败", err);
      set({ isPlaying: false, isLoadingMusic: false });
    }
  },

  togglePlay: () => {
    const { isPlaying, currentSong, playSong, isFmMode } = get();
    if (!currentSong) return;

    if (!corePlayer.isReady()) {
      playSong(currentSong, isFmMode);
      return;
    }

    if (isPlaying) corePlayer.pause();
    else corePlayer.resume();

    set({ isPlaying: !isPlaying });
  },

  next: () => {
    if (get().isFmMode) {
      get().nextFmSong();
      return;
    }

    const {
      togglePlay,
      currentIndexInPlaylist,
      playlist,
      currentSong,
      repeatMode,
      isShuffle,
    } = get();
    if (!currentSong || playlist.length === 0) return;

    // 单曲循环
    if (repeatMode === "single") {
      corePlayer.seek(0);
      corePlayer.resume();
      set({ isPlaying: true });
      return;
    }

    let nextIdx: number;
    // 随机播放
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1 && nextIdx === currentIndexInPlaylist) {
        nextIdx = (nextIdx + 1) % playlist.length;
      }
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
    if (get().isFmMode) {
      get().seek(0);
      return;
    }

    const {
      currentIndexInPlaylist,
      playlist,
      currentSong,
      repeatMode,
      isShuffle,
    } = get();
    if (!currentSong || playlist.length === 0) return;

    // 单曲循环
    if (repeatMode === "single") {
      corePlayer.seek(0);
      corePlayer.resume();
      set({ isPlaying: true });
      return;
    }

    let prevIdx: number;
    // 随机播放
    if (isShuffle) {
      prevIdx = Math.floor(Math.random() * playlist.length);
      if (playlist.length > 1 && prevIdx === currentIndexInPlaylist) {
        prevIdx = (prevIdx - 1 + playlist.length) % playlist.length;
      }
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

  isFmMode: false,
  fmRepeatMode: false,

  toggleFmRepeatMode: async () => {
    const { fmRepeatMode } = get();
    set({ fmRepeatMode: !fmRepeatMode });
  },

  fetchFmSongs: async () => {
    const res = await getPersonalFm();
    if (res && res.length > 0) {
      set({ fmPlaylist: [...get().fmPlaylist, ...res] });
    }
  },

  playFm: async () => {
    const { fmPlaylist, fetchFmSongs, playSong } = get();

    if (fmPlaylist.length === 0) await fetchFmSongs();

    const currentFmSongs = get().fmPlaylist;
    if (currentFmSongs.length > 0) {
      set({ isFmMode: true });
      playSong(currentFmSongs[0], true);
    }
  },

  nextFmSong: () => {
    set({ isFmMode: true });
    const { fmPlaylist, fmRepeatMode, playSong, fetchFmSongs } = get();

    if (fmRepeatMode) {
      corePlayer.seek(0);
      corePlayer.resume();
      set({ isPlaying: true });
      return;
    }

    const newFmPlaylist = fmPlaylist.slice(1);
    set({ fmPlaylist: newFmPlaylist });

    if (newFmPlaylist.length > 0) {
      playSong(newFmPlaylist[0], true);
    }

    if (newFmPlaylist.length <= 1) {
      fetchFmSongs();
    }
  },

  trashFmSong: async () => {
    const { currentSong, nextFmSong } = get();
    if (!currentSong) return;

    try {
      await fmTrash(currentSong.id);
      nextFmSong();
    } catch (error) {
      console.error("垃圾桶操作失败", error);
    }
  },
});
