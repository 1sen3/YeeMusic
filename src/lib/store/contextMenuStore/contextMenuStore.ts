import { create } from "zustand";
export type ContextMenuType =
	| "song"
	| "song-artist-info"
	| "playlist"
	| "album"
	| "artist"
	| "resource"
	| "text-selection"
	| null;

interface ContextMenuState {
	isOpen: boolean;
	x: number;
	y: number;
	type: ContextMenuType;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;

	openMenu: (
		x: number,
		y: number,
		type: ContextMenuType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		data: any,
	) => void;
	closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
	isOpen: false,
	x: 0,
	y: 0,
	type: null,
	data: null,

	openMenu: (x: number, y: number, type: ContextMenuType, data: any) => {
		set({ isOpen: true, x, y, type, data });
	},
	closeMenu: () => {
		set({ isOpen: false, x: 0, y: 0, data: null });
	},
}));
