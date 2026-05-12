import { LocalTrack } from "@/lib/types/localMusic";
import { create } from "zustand";
import { getLocalMusicStore } from "./localMusic.persistence";
import { scanLocalMusic } from "@/lib/services/localMusic";

interface LocalMusicState {
  tracks: LocalTrack[];
  scanDirs: string[];
  lastScanTime: number | null;
  isScanning: boolean;
  hydrated: boolean;

  loadFromCache: () => Promise<void>;
  addScanDir: (dir: string) => Promise<void>;
  removeScanDir: (dir: string) => Promise<void>;
  scanAll: () => Promise<void>;
  save: () => Promise<void>;
}

export const useLocalMusicStore = create<LocalMusicState>((set, get) => ({
  tracks: [],
  scanDirs: [],
  lastScanTime: null,
  isScanning: false,
  hydrated: false,

  loadFromCache: async () => {
    const store = await getLocalMusicStore();
    const scanDirs = await store.get<string[]>("scanDirs");
    const tracks = await store.get<LocalTrack[]>("tracks");
    const lastScanTime = await store.get<number>("lastScanTime");

    if (!scanDirs || scanDirs.length === 0) {
      const { getDefaultMusicDir } = await import("@/lib/services/localMusic");
      try {
        const defaultDir = await getDefaultMusicDir();
        set({
          scanDirs: [defaultDir],
          tracks: tracks ?? [],
          lastScanTime: lastScanTime ?? null,
          hydrated: true,
        });
        const { save } = get();
        await save();
        return;
      } catch (e) {
        console.error("[LocalMusic] 获取默认音乐目录失败", e);
      }
    }

    set({
      scanDirs: scanDirs ?? [],
      tracks: tracks ?? [],
      lastScanTime: lastScanTime ?? null,
      hydrated: true,
    });
  },

  addScanDir: async (dir: string) => {
    const { scanDirs, save, scanAll } = get();
    if (scanDirs.includes(dir)) return;

    set({ scanDirs: [...scanDirs, dir] });

    await save();
    await scanAll();
  },

  removeScanDir: async (dir: string) => {
    const { scanDirs, tracks, save } = get();
    const newDirs = scanDirs.filter((d) => d != dir);
    const newTracks = tracks.filter((t) => !t.filePath.startsWith(dir));
    set({ scanDirs: newDirs, tracks: newTracks });
    await save();
  },

  scanAll: async () => {
    const { scanDirs, save } = get();
    if (scanDirs.length === 0) return;

    set({ isScanning: true });

    try {
      const allTracks: LocalTrack[] = [];
      for (const dir of scanDirs) {
        try {
          const dirTracks = await scanLocalMusic(dir);
          allTracks.push(...dirTracks);
        } catch (e) {
          console.error(`[LocalMusic] 扫描目录失败: ${dir}`, e);
        }
      }

      set({
        tracks: allTracks,
        lastScanTime: Date.now(),
        isScanning: false,
      });
      await save();
    } catch (e) {
      console.error("[LocalMusic] 扫描失败", e);
      set({ isScanning: false });
    }
  },

  save: async () => {
    const store = await getLocalMusicStore();
    const { scanDirs, tracks, lastScanTime } = get();
    await store.set("scanDirs", scanDirs);
    await store.set("tracks", tracks);
    await store.set("lastScanTime", lastScanTime);
    await store.save();
  },
}));

export async function initLocalMusic() {
  await useLocalMusicStore.getState().loadFromCache();
}
