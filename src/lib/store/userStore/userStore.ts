import { createJSONStorage, persist } from "zustand/middleware";
import { Album, Artist, Playlist, UserProfile } from "../../types";
import { create } from "zustand";
import { idbStorage } from "../idbStorage";

interface UserState {
  user: UserProfile | null;
  isLoggedin: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  likeList: number[]; // 已喜欢音乐 id 列表
  likeListSet: Set<number>;
  setLikeList: (likeList: number[]) => void;

  artistList: Artist[]; // 收藏歌手列表
  artistListSet: Set<number>;
  setArtistList: (artistList: Artist[]) => void;

  playlistList: Playlist[]; // 用户歌单列表
  favPlaylist: Playlist | null; // 用户喜欢歌单
  createdPlaylists: Playlist[]; // 创建的歌单
  subscribedPlaylists: Playlist[]; // 收藏的歌单
  setPlaylistList: (playlistList: Playlist[]) => void;

  albumList: Album[];
  albumListSet: Set<number>;
  setAlbumList: (albumList: Album[]) => void;

  toggleLikeMusic: (id: number, isLike: boolean) => void;
  toggleLikePlaylist: (playlist: Playlist, isLike: boolean) => void;
  toggleLikeArtist: (artist: Artist, isLike: boolean) => void;
  toggleLikeAlbum: (album: Album, isLike: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    persist(
      (set, get) => ({
        user: null,
        isLoggedin: false,
        setUser: (user) => set({ user, isLoggedin: !!user }),
        logout: () =>
          set({
            user: null,
            isLoggedin: false,
            likeList: [],
            likeListSet: new Set<number>(),
            artistList: [],
            artistListSet: new Set<number>(),
            playlistList: [],
            favPlaylist: null,
            createdPlaylists: [],
            subscribedPlaylists: [],
            albumList: [],
            albumListSet: new Set<number>(),
          }),

        likeList: [],
        likeListSet: new Set<number>(),
        setLikeList: (likeList: number[]) => {
          const likeListSet = new Set(likeList);
          set({ likeList, likeListSet });
        },

        artistList: [],
        artistListSet: new Set<number>(),
        setArtistList: (artistList: Artist[]) => {
          const artistListSet = new Set(artistList.map((artist) => artist.id));
          set({ artistList, artistListSet });
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

        albumList: [],
        albumListSet: new Set<number>(),
        setAlbumList: (albumList: Album[]) => {
          const albumListSet = new Set(albumList.map((album) => album.id));
          set({ albumList, albumListSet });
        },

        toggleLikeMusic: (id: number, isLike: boolean) => {
          const { likeList } = get();

          if (isLike) {
            const newList = [...likeList, id];
            set({ likeList: newList, likeListSet: new Set(newList) });
          } else {
            const newList = likeList.filter((item) => item !== id);
            set({ likeList: newList, likeListSet: new Set(newList) });
          }
        },

        toggleLikePlaylist(playlist: Playlist, isLike: boolean) {
          const { playlistList, setPlaylistList } = get();

          if (isLike) {
            const newPlaylistList = [...playlistList, playlist];
            setPlaylistList(newPlaylistList);
          } else {
            const newPlaylistList = playlistList.filter(
              (pl) => pl.id !== playlist.id,
            );
            setPlaylistList(newPlaylistList);
          }
        },

        toggleLikeArtist(artist: Artist, isLike: boolean) {
          const { artistList } = get();

          if (isLike) {
            const newList = [...artistList, artist];
            set({
              artistList: newList,
              artistListSet: new Set(newList.map((artist) => artist.id)),
            });
          } else {
            const newList = artistList.filter((item) => item.id !== artist.id);
            set({
              artistList: newList,
              artistListSet: new Set(newList.map((artist) => artist.id)),
            });
          }
        },

        toggleLikeAlbum(album: Album, isLike: boolean) {
          const { albumList } = get();

          if (isLike) {
            const newList = [...albumList, album];
            set({
              albumList: newList,
              albumListSet: new Set(newList.map((album) => album.id)),
            });
          } else {
            const newList = albumList.filter((item) => item.id !== album.id);
            set({
              albumList: newList,
              albumListSet: new Set(newList.map((album) => album.id)),
            });
          }
        },
      }),
      {
        name: "user-store-ls",
        partialize: (state) => ({
          user: state.user,
          isLoggedin: state.isLoggedin,
          likeList: state.likeList,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            state.likeListSet = new Set(state.likeList);
          }
        },
      },
    ),
    {
      name: "user-store-idb",
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({
        playlistList: state.playlistList,
        artistList: state.artistList,
        albumList: state.albumList,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.playlistList) state.setPlaylistList(state.playlistList);
          if (state.artistList)
            state.artistListSet = new Set(state.artistList.map((a) => a.id));
          if (state.albumList)
            state.albumListSet = new Set(state.albumList.map((a) => a.id));
        }
      },
    },
  ),
);
