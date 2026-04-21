import { StateCreator } from "zustand";
import { SharedPlayerState, SongInfoSlice } from "@/lib/types/player";
import { QUALITY_BY_KEY, QualityKey } from "@/lib/constants/song";
import { getSongUrl } from "@/lib/services/song";
import { corePlayer } from "@/lib/player/corePlayer";

export const createSongInfoSlice: StateCreator<
  SharedPlayerState,
  [],
  [],
  SongInfoSlice
> = (set, get) => ({
  currentSong: null,
  currentSongMusicDetail: [],
  currentSongLyrics: null,
  currentMusicLevelKey: "sq",

  setCurrentMusicLevelKey: async (key: QualityKey) => {
    const { currentSong, currentMusicLevelKey, currentTime } = get();

    if (!currentSong || key === currentMusicLevelKey) {
      set({ currentMusicLevelKey: key });
      return;
    }

    set({ currentMusicLevelKey: key, isLoadingMusic: true });

    try {
      const res = await getSongUrl(
        [currentSong.id.toString()],
        QUALITY_BY_KEY[key].level,
      );

      if (res?.[0]?.url) {
        corePlayer.play(
          res?.[0]?.url,
          () => get().next(),
          (duration) => {
            set({ isPlaying: true, duration, isLoadingMusic: false });
            get().seek((currentTime / duration) * 100);
          },
          (currentTime) => {
            const { duration } = get();
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            set({ currentTime, progress });
          },
        );
      }
    } catch (err) {
      console.log("切换音质失败", err);
      set({ isLoadingMusic: false });
    }
  },
});
