import { UserProfile } from "../types";
import { create } from "zustand";

interface UserState {
  user: UserProfile | null;
  isLoggedin: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  likeList: number[]; // 已喜欢音乐 id 列表
  likeListSet: Set<number>;
  setLikeList: (likeList: number[]) => void;
  toggleLike: (id: number, isLike: boolean) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
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
}));
