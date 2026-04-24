import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { usePlayerStore } from "./playerStore";
import { shallow } from "zustand/shallow";

export function initMediaSession() {
  // 歌曲变化时，通知 Rust 更新 SMTC 元数据，并同步给托盘菜单
  usePlayerStore.subscribe(
    (state) => ({ currentSong: state.currentSong, isPlaying: state.isPlaying }),
    ({ currentSong, isPlaying }) => {
      if (!currentSong) return;

      // 设置元数据
      invoke("smtc_update_metadata", {
        title: currentSong.name || "",
        artist: currentSong.ar?.map((a) => a.name).join("、") || "",
        album: currentSong.al?.name || "",
        coverUrl: currentSong.al?.picUrl
          ? `${currentSong.al.picUrl}?param=512y512`
          : "",
        durationSecs: 0,
      }).catch((e) => console.error("Update SMTC Info Failed:", e));

      emit("sync-player-state", {
        title: currentSong.name || "Yee Music",
        artist: currentSong.ar?.map((a) => a.name).join("、") || "未播放",
        coverUrl: currentSong.al?.picUrl
          ? `${currentSong.al.picUrl}?param=128y128`
          : "",
        isPlaying,
      }).catch(console.error);
    },
    { equalityFn: shallow },
  );

  // 播放状态或总时长变化时, 通知 Rust 更新 SMTC 播放状态
  usePlayerStore.subscribe(
    (state) => ({
      isPlaying: state.isPlaying,
      duration: state.duration,
    }),
    ({ isPlaying, duration }) => {
      const time = usePlayerStore.getState().currentTime;

      invoke("smtc_update_playback", {
        isPlaying,
        positionSecs: time,
        durationSecs: duration,
      }).catch(console.error);
    },
    { equalityFn: shallow },
  );

  usePlayerStore.subscribe(
    (state) => ({
      isShuffle: state.isShuffle,
      repeatMode: state.repeatMode,
    }),
    ({ isShuffle, repeatMode }) => {
      emit("sync-play-mode", {
        isShuffle,
        repeatMode,
      }).catch(console.error);
    },
    { equalityFn: shallow },
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
      case "shuffle":
        store.toggleShuffleMode();
        break;
      case "repeat":
        store.toggleRepeatMode();
        break;
    }
  });
}
