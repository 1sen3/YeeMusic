import { create } from "zustand";
import { SharedPlayerState } from "../types/player";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { createPlaylistSlice } from "./playerStoreSlice/createPlaylistSlice";
import { createPlayerControlSlice } from "./playerStoreSlice/createPlayerControlSlice";
import { createSongInfoSlice } from "./playerStoreSlice/createSongInfoSlice";
import { idbStorage } from "./idbStorage";

export const usePlayerStore = create<SharedPlayerState>()(
  persist(
    persist(
      subscribeWithSelector((...a) => ({
        ...createPlaylistSlice(...a),
        ...createPlayerControlSlice(...a),
        ...createSongInfoSlice(...a),
      })),
      {
        name: "player-store-ls",
        partialize: (state) => ({
          currentSong: state.currentSong,
          currentIndexInPlaylist: state.currentIndexInPlaylist,
          volume: state.volume,
          currentMusicLevelKey: state.currentMusicLevelKey,
          repeatMode: state.repeatMode,
          isShuffle: state.isShuffle,
        }),
      },
    ),
    {
      name: "player-store-idb",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        playlist: state.playlist,
      }),
    },
  ),
);
