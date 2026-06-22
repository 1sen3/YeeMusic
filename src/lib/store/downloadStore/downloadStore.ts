import { Store } from "@tauri-apps/plugin-store";
import { DownloadTask, DownloadedSong, Song } from "../../types";
import { create } from "zustand";
import { toast } from "sonner";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { downloadMusic } from "../../services/song";
import { useLocalMusicStore } from "../localMusicStore/localMusicStore";

let storeInstance: Store | null = null;
async function getDownloadStore() {
  if (!storeInstance) {
    storeInstance = await Store.load("downloads.json");
  }
  return storeInstance;
}

function buildFileName(song: Song, level: string, fileType: string): string {
  const artists = song.ar.map((a) => a.name).join(", ");
  const raw = `${song.name} - ${artists} [${level}]`;
  const safe = raw.replace(/[\/\\:*?"<>|]/g, "_");
  return `${safe}.${fileType}`;
}

type DownloadStore = {
  downloadDir: string;
  downloadedSongs: DownloadedSong[];
  activeTasks: Map<number, DownloadTask>;

  loadFromStore: () => Promise<void>;
  setDownloadDir: (path: string) => Promise<void>;
  startDownload: (song: Song, level: string) => Promise<void>;
  pauseDownload: (songId: number) => Promise<void>;
  resumeDownload: (songId: number) => Promise<void>;
  removeDownloadedSong: (songId: number) => Promise<void>;
};

/** 内部：启动一次实际的下载（首次或续传共用） */
async function runDownload(
  song: Song,
  level: string,
  savePath: string,
  resumeFrom: number,
  set: (fn: (s: DownloadStore) => Partial<DownloadStore>) => void,
  get: () => DownloadStore,
) {
  const data = await downloadMusic(song.id, level);
  if (!data || !data.url) {
    toast.error("获取下载链接失败");
    return;
  }
  if (data.freeTrialPrivilege?.resConsumable) {
    toast.error("该资源受版权保护，无法下载");
    return;
  }

  // 更新任务状态为 downloading
  set((s) => {
    const next = new Map(s.activeTasks);
    const t = next.get(song.id);
    if (t) next.set(song.id, { ...t, status: "downloading", total: data.size });
    return { activeTasks: next };
  });

  // 用于在监听器之间共享 unlisten 函数
  let unlistenProgress: (() => void) | null = null;
  let unlistenComplete: (() => void) | null = null;
  let unlistenPaused: (() => void) | null = null;

  const cleanupListeners = () => {
    unlistenProgress?.();
    unlistenComplete?.();
    unlistenPaused?.();
  };

  unlistenProgress = await listen<{
    song_id: number;
    downloaded: number;
    total: number;
    speed: number;
  }>("download-progress", (e) => {
    if (e.payload.song_id !== song.id) return;
    set((s) => {
      const next = new Map(s.activeTasks);
      const t = next.get(song.id);
      if (t) {
        next.set(song.id, {
          ...t,
          status: "downloading",
          downloaded: e.payload.downloaded,
          total: e.payload.total,
          speed: e.payload.speed,
        });
      }
      return { activeTasks: next };
    });
  });

  unlistenComplete = await listen<{ song_id: number }>(
    "download-complete",
    async (e) => {
      if (e.payload.song_id !== song.id) return;
      cleanupListeners();

      const finished: DownloadedSong = {
        song,
        br: data.br,
        level: data.level,
        fileType: data.type,
        sr: data.sr,
        md5: data.md5,
        savePath,
        fileSize: data.size,
        downloadedAt: Date.now(),
      };

      const store = await getDownloadStore();
      const updated = [...get().downloadedSongs, finished];
      await store.set("downloadedSongs", updated);
      await store.save();

      set((s) => {
        const next = new Map(s.activeTasks);
        next.delete(song.id);
        return { activeTasks: next, downloadedSongs: updated };
      });

      void useLocalMusicStore
        .getState()
        .upsertDownloadedSong(finished)
        .catch((err) => {
          console.error("[Download] 添加到本地音乐失败", err);
          toast.error("下载完成，但添加到本地音乐失败");
        });

      toast.success(`《${song.name}》下载完成`);
    },
  );

  unlistenPaused = await listen<{ song_id: number; bytes_written: number }>(
    "download-paused",
    (e) => {
      if (e.payload.song_id !== song.id) return;
      cleanupListeners();
      set((s) => {
        const next = new Map(s.activeTasks);
        const t = next.get(song.id);
        if (t) {
          next.set(song.id, {
            ...t,
            status: "paused",
            downloaded: e.payload.bytes_written,
            speed: 0,
          });
        }
        return { activeTasks: next };
      });
    },
  );

  try {
    await invoke("download_song", {
      url: data.url,
      savePath,
      songId: song.id,
      resumeFrom: resumeFrom > 0 ? resumeFrom : null,
    });
  } catch (e) {
    cleanupListeners();
    set((s) => {
      const next = new Map(s.activeTasks);
      const t = next.get(song.id);
      if (t) next.set(song.id, { ...t, status: "error" });
      return { activeTasks: next };
    });
    toast.error(`下载失败：${e}`);
  }
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  downloadDir: "",
  downloadedSongs: [],
  activeTasks: new Map(),

  loadFromStore: async () => {
    const store = await getDownloadStore();
    const dir = await store.get<string>("downloadDir");
    const songs = await store.get<DownloadedSong[]>("downloadedSongs");
    const defaultDir =
      dir ?? (await invoke<string>("get_default_download_dir"));
    set({ downloadDir: defaultDir, downloadedSongs: songs ?? [] });

    if (songs?.length) {
      void useLocalMusicStore
        .getState()
        .upsertDownloadedSongs(songs)
        .catch((err) => {
          console.error("[Download] 同步已下载歌曲到本地音乐失败", err);
        });
    }
  },

  setDownloadDir: async (path) => {
    const store = await getDownloadStore();
    await store.set("downloadDir", path);
    await store.save();
    set({ downloadDir: path });
  },

  startDownload: async (song, level) => {
    const { downloadDir, activeTasks } = get();

    if (activeTasks.has(song.id)) {
      toast.info("该歌曲已在下载队列中");
      return;
    }

    // 先临时拿一次 API，获取文件类型以确定文件名
    const preview = await downloadMusic(song.id, level);
    if (!preview || !preview.url) {
      toast.error("获取下载链接失败");
      return;
    }
    if (preview.freeTrialPrivilege?.resConsumable) {
      toast.error("该资源受版权保护，无法下载");
      return;
    }

    const fileName = buildFileName(song, preview.level, preview.type);
    const savePath = `${downloadDir}\\${fileName}`;

    const task: DownloadTask = {
      songId: song.id,
      song,
      level,
      status: "pending",
      downloaded: 0,
      total: preview.size,
      speed: 0,
      savePath,
      addedAt: Date.now(),
    };

    set((s) => {
      const next = new Map(s.activeTasks);
      next.set(song.id, task);
      return { activeTasks: next };
    });

    await runDownload(song, level, savePath, 0, set, get);
  },

  pauseDownload: async (songId) => {
    try {
      await invoke("pause_download", { songId });
    } catch (e) {
      toast.error(`暂停失败：${e}`);
    }
  },

  resumeDownload: async (songId) => {
    const task = get().activeTasks.get(songId);
    if (!task || task.status !== "paused") return;

    set((s) => {
      const next = new Map(s.activeTasks);
      next.set(songId, { ...task, status: "pending" });
      return { activeTasks: next };
    });

    await runDownload(
      task.song,
      task.level,
      task.savePath,
      task.downloaded, // 续传 offset
      set,
      get,
    );
  },

  removeDownloadedSong: async (songId) => {
    const updated = get().downloadedSongs.filter((s) => s.song.id !== songId);
    const store = await getDownloadStore();
    await store.set("downloadedSongs", updated);
    await store.save();
    set({ downloadedSongs: updated });
  },
}));
