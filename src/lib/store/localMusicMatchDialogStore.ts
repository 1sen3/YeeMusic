import type { Song } from "@/lib/types";
import { create } from "zustand";

interface LocalMusicMatchDialogState {
	song: Song | null;
	open: (song: Song) => void;
	close: () => void;
}

export const useLocalMusicMatchDialogStore = create<LocalMusicMatchDialogState>(
	(set) => ({
		song: null,
		open: (song) => set({ song }),
		close: () => set({ song: null }),
	}),
);
