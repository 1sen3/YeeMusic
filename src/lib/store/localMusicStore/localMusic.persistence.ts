import { Store, load } from "@tauri-apps/plugin-store";

let store: Store | null = null;

export async function getLocalMusicStore() {
  if (!store) {
    store = await load("local-music.json");
  }
  return store;
}
