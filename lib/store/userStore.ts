import { persist } from "zustand/middleware";
import { Playlist, UserProfile } from "../types";
import { create } from "zustand";

interface UserState {
  user: UserProfile | null;
  isLoggedin: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  likeList: number[]; // 已喜欢音乐 id 列表
  likeListSet: Set<number>;
  setLikeList: (likeList: number[]) => void;

  playlistList: Playlist[]; // 用户歌单列表
  favPlaylist: Playlist | null; // 用户喜欢歌单
  createdPlaylists: Playlist[]; // 创建的歌单
  subscribedPlaylists: Playlist[]; // 收藏的歌单
  setPlaylistList: (playlistList: Playlist[]) => void;

  toggleLike: (id: number, isLike: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedin: false,
      setUser: (user) => set({ user, isLoggedin: !!user }),
      logout: () => set({ user: null, isLoggedin: false }),

      likeList: [],
      likeListSet: new Set<number>(),
      setLikeList: (likeList: number[]) => {
        const likeListSet = new Set(likeList);
        set({ likeList, likeListSet });
      },

      playlistList: [],
      favPlaylist: null,
      createdPlaylists: [],
      subscribedPlaylists: [],
      setPlaylistList: (playlistList: Playlist[]) => {
        const userId = get().user?.userId;

        const favPlaylist = playlistList.find(
          (pl) => pl.creator.userId === userId && pl.specialType === 5,
        );

        const createdPlaylists = playlistList.filter(
          (pl) => pl.creator.userId === userId && pl.specialType === 0,
        );

        const subscribedPlaylists = playlistList.filter(
          (pl) => pl.creator.userId !== userId,
        );

        set({
          playlistList,
          favPlaylist,
          createdPlaylists,
          subscribedPlaylists,
        });
      },

      toggleLike: (id: number, isLike: boolean) => {
        const { likeList } = get();

        if (isLike) {
          const newList = [...likeList, id];
          set({ likeList: newList, likeListSet: new Set(newList) });
        } else {
          const newList = likeList.filter((item) => item !== id);
          set({ likeList: newList, likeListSet: new Set(newList) });
        }
      },
    }),
    {
      name: "user-store",
      partialize: (state) => ({
        user: state.user,
        isLoggedin: state.isLoggedin,
        likeList: state.likeList,
        playlistList: state.playlistList,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.playlistList) {
          state.setPlaylistList(state.playlistList);
          state.likeListSet = new Set(state.likeList);
        }
      },
    },
  ),
);
