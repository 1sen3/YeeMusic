import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { usePlayerStore } from "./playerStore";

export function initMediaSession() {
  // 歌曲变化时 → 通知 Rust 更新 SMTC 元数据
  usePlayerStore.subscribe(
    (state) => state.currentSong,
    (currentSong) => {
      if (!currentSong) return;
      // 先设置元数据（duration 会在 onPlay 后通过 playback 更新）
      invoke("smtc_update_metadata", {
        title: currentSong.name,
        artist: currentSong.ar.map((a) => a.name).join("、"),
        album: currentSong.al.name,
        coverUrl: `${currentSong.al?.picUrl}?param=512y512`,
        durationSecs: 0,
      });
    },
  );

  // 播放状态 / 进度变化时 → 通知 Rust 更新 SMTC 播放状态
  usePlayerStore.subscribe(
    (state) => ({
      isPlaying: state.isPlaying,
      time: state.currentTime,
      duration: state.duration,
    }),
    ({ isPlaying, time, duration }) => {
      invoke("smtc_update_playback", {
        isPlaying,
        positionSecs: time,
        durationSecs: duration,
      });
    },
  );

  // 监听 Rust 转发的 SMTC 控制事件
  listen<{ event: string; position?: number }>("smtc-event", (e) => {
    const { event, position } = e.payload;
    const store = usePlayerStore.getState();

    switch (event) {
      case "play":
        if (!store.isPlaying) store.togglePlay();
        break;
      case "pause":
        if (store.isPlaying) store.togglePlay();
        break;
      case "toggle":
        store.togglePlay();
        break;
      case "next":
        store.next();
        break;
      case "previous":
        store.prev();
        break;
      case "set_position":
        if (position !== undefined && store.duration > 0) {
          store.seek((position / store.duration) * 100);
        }
        break;
    }
  });
}
