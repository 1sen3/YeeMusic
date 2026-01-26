import { UserProfile } from "../types";
import { create } from "zustand";

interface UserState {
  user: UserProfile | null;
  isLoggedin: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoggedin: false,
  setUser: (user) => set({ user, isLoggedin: !!user }),
  logout: () => set({ user: null, isLoggedin: false }),
}));