import { load, Store } from "@tauri-apps/plugin-store";

let store: Store | null = null;

export async function getSettingsStore() {
	if (!store) {
		store = await load("settings.json");
	}
	return store;
}
