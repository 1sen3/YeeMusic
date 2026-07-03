import { create } from "zustand";
import { isTauri } from "@tauri-apps/api/core";
import { Effect } from "@tauri-apps/api/window";
import { getSettingsStore } from "./settings.persistence";
import { QualityKey } from "../../constants/song";
import {
	DEFAULT_AUDIO_OUTPUT_DEVICE_ID,
	DEFAULT_AUDIO_OUTPUT_DEVICE_NAME,
} from "@/lib/constants/audio-output-devices";
import { type AudioDeviceInfo, corePlayer } from "@/lib/player/corePlayer";

const APPEARANCE_SYNC_EVENT = "settings-appearance-changed";

export interface FontSettings {
	interfaceFontStr: string;
	lyricFontStr: string;
}

export interface AppearanceSettings {
	theme: "light" | "dark" | "system";
	material: "acrylic" | "mica" | "none";
	font: FontSettings;
}

export interface OutputDeviceProfile {
	id: string;
	displayName?: string;
	iconKey?: string;
	lastKnownName: string;
	firstSeenAt: number;
	lastSeenAt: number;
}

export type OutputDeviceProfiles = Record<string, OutputDeviceProfile>;

export interface AudioSettings {
	preferQuality: QualityKey;
	maxCacheSize: number;
	outputDeviceId: string | null;
	outputDeviceProfiles: OutputDeviceProfiles;
	replayGainEnabled: boolean;
	replayGainPreampDb: number;
	equalizerEnabled: boolean;
	equalizerGainsDb: number[];
	crossfadeDuration: number;
}

const defaultAppearanceSettings: AppearanceSettings = {
	theme: "system",
	material: "mica",
	font: {
		interfaceFontStr: "",
		lyricFontStr: "",
	},
};

const defaultOutputDeviceProfiles: OutputDeviceProfiles = {
	[DEFAULT_AUDIO_OUTPUT_DEVICE_ID]: {
		id: DEFAULT_AUDIO_OUTPUT_DEVICE_ID,
		lastKnownName: DEFAULT_AUDIO_OUTPUT_DEVICE_NAME,
		firstSeenAt: 0,
		lastSeenAt: 0,
	},
};

const defaultAudioSettings: AudioSettings = {
	preferQuality: "l",
	maxCacheSize: 10,
	outputDeviceId: null,
	outputDeviceProfiles: defaultOutputDeviceProfiles,
	replayGainEnabled: true,
	replayGainPreampDb: 0,
	equalizerEnabled: false,
	equalizerGainsDb: [0, 0, 0, 0, 0],
	crossfadeDuration: 0,
};

type OutputDeviceProfilePatch = Partial<
	Pick<OutputDeviceProfile, "displayName" | "iconKey">
>;

interface UpdateAudioEngineOptions {
	throwOnApplyError?: boolean;
}

type SettingStore = {
	appearance: AppearanceSettings;
	audio: AudioSettings;
	hydrated: boolean;

	setTheme: (theme: AppearanceSettings["theme"]) => void;
	setMaterial: (material: AppearanceSettings["material"]) => void;
	updateFont: (patch: Partial<FontSettings>) => void;

	loadSettings: () => Promise<void>;
	saveSettings: () => Promise<void>;
	resetAppearance: () => Promise<void>;

	setPreferQuality: (quality: QualityKey) => Promise<void>;
	setMaxCacheSize: (size: number) => Promise<void>;
	upsertOutputDeviceProfiles: (devices: AudioDeviceInfo[]) => Promise<void>;
	updateOutputDeviceProfile: (
		id: string,
		patch: OutputDeviceProfilePatch,
	) => Promise<void>;
	updateAudioEngine: (
		patch: Partial<AudioSettings>,
		options?: UpdateAudioEngineOptions,
	) => Promise<void>;
};

export const useSettingStore = create<SettingStore>((set, get) => ({
	appearance: defaultAppearanceSettings,
	audio: defaultAudioSettings,
	hydrated: false,

	setTheme: (theme) => {
		set((state) => ({
			appearance: {
				...state.appearance,
				theme,
			},
		}));
		get().saveSettings();
		broadcastAppearance(get().appearance);
	},

	setMaterial: (material) => {
		set((state) => ({
			appearance: {
				...state.appearance,
				material,
			},
		}));
		get().saveSettings();
		broadcastAppearance(get().appearance);
	},

	updateFont: (patch) => {
		set((state) => ({
			appearance: {
				...state.appearance,
				font: {
					...state.appearance.font,
					...patch,
				},
			},
		}));
		get().saveSettings();
		broadcastAppearance(get().appearance);
	},

	loadSettings: async () => {
		const store = await getSettingsStore();
		const savedAppearance = await store.get<AppearanceSettings>("appearance");
		const savedAudio = await store.get<Partial<AudioSettings>>("audio");

		set({
			appearance: savedAppearance
				? {
						...defaultAppearanceSettings,
						...savedAppearance,
					}
				: defaultAppearanceSettings,
			audio: normalizeAudioSettings(savedAudio, get().audio),
			hydrated: true,
		});
	},

	saveSettings: async () => {
		const store = await getSettingsStore();
		await store.set("appearance", get().appearance);
		await store.set("audio", get().audio);
		await store.save();
	},

	resetAppearance: async () => {
		const store = await getSettingsStore();
		set({ appearance: defaultAppearanceSettings });
		await store.set("appearance", defaultAppearanceSettings);
		await store.save();
		broadcastAppearance(defaultAppearanceSettings);
	},

	setPreferQuality: async (quality: QualityKey) => {
		const store = await getSettingsStore();
		set({ audio: { ...get().audio, preferQuality: quality } });
		await store.set("audio", get().audio);
		await store.save();
	},

	setMaxCacheSize: async (size: number) => {
		const store = await getSettingsStore();
		set({ audio: { ...get().audio, maxCacheSize: size } });
		await store.set("audio", get().audio);
		await store.save();
	},

	upsertOutputDeviceProfiles: async (devices) => {
		const store = await getSettingsStore();
		const now = Date.now();
		set((state) => {
			const outputDeviceProfiles = {
				...state.audio.outputDeviceProfiles,
			};
			for (const device of devices) {
				if (!device.id) continue;
				const previous = outputDeviceProfiles[device.id];
				outputDeviceProfiles[device.id] = {
					id: device.id,
					displayName: previous?.displayName,
					iconKey: previous?.iconKey,
					lastKnownName:
						device.name ||
						previous?.lastKnownName ||
						getFallbackDeviceName(device.id),
					firstSeenAt: previous?.firstSeenAt ?? now,
					lastSeenAt: now,
				};
			}

			return {
				audio: {
					...state.audio,
					outputDeviceProfiles,
				},
			};
		});
		await store.set("audio", get().audio);
		await store.save();
	},

	updateOutputDeviceProfile: async (id, patch) => {
		if (!id) return;

		const store = await getSettingsStore();
		const now = Date.now();
		set((state) => {
			const previous = state.audio.outputDeviceProfiles[id];
			const nextProfile: OutputDeviceProfile = {
				...previous,
				id,
				lastKnownName: previous?.lastKnownName ?? getFallbackDeviceName(id),
				firstSeenAt: previous?.firstSeenAt ?? now,
				lastSeenAt: previous?.lastSeenAt ?? now,
			};

			if ("displayName" in patch) {
				nextProfile.displayName = normalizeOptionalString(patch.displayName);
			}
			if ("iconKey" in patch) {
				nextProfile.iconKey = normalizeOptionalString(patch.iconKey);
			}
			if (!nextProfile.displayName) delete nextProfile.displayName;
			if (!nextProfile.iconKey) delete nextProfile.iconKey;

			return {
				audio: {
					...state.audio,
					outputDeviceProfiles: {
						...state.audio.outputDeviceProfiles,
						[id]: nextProfile,
					},
				},
			};
		});
		await store.set("audio", get().audio);
		await store.save();
	},

	updateAudioEngine: async (patch, options) => {
		const store = await getSettingsStore();
		set({ audio: { ...get().audio, ...patch } });
		await store.set("audio", get().audio);
		await store.save();
		await applyAudioEngine(get().audio, options?.throwOnApplyError);
	},
}));

function normalizeAudioSettings(
	savedAudio?: Partial<AudioSettings>,
	fallbackAudio: AudioSettings = defaultAudioSettings,
): AudioSettings {
	const audio = savedAudio
		? { ...defaultAudioSettings, ...savedAudio }
		: fallbackAudio;
	return {
		...audio,
		outputDeviceProfiles: normalizeOutputDeviceProfiles(
			audio.outputDeviceProfiles,
		),
	};
}

function normalizeOutputDeviceProfiles(
	profiles?: OutputDeviceProfiles,
): OutputDeviceProfiles {
	return {
		...defaultOutputDeviceProfiles,
		...(profiles ?? {}),
	};
}

function getFallbackDeviceName(id: string) {
	return id === DEFAULT_AUDIO_OUTPUT_DEVICE_ID
		? DEFAULT_AUDIO_OUTPUT_DEVICE_NAME
		: id;
}

function normalizeOptionalString(value: string | undefined) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

async function broadcastAppearance(appearance: AppearanceSettings) {
	if (!isTauri()) return;

	try {
		const { emit } = await import("@tauri-apps/api/event");
		await emit(APPEARANCE_SYNC_EVENT, appearance);
	} catch (error) {
		console.error("Failed to broadcast appearance settings", error);
	}
}

function applyTheme(theme: AppearanceSettings["theme"]) {
	const root = window.document.documentElement;
	root.classList.remove("light", "dark");
	if (theme === "system") {
		const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
			.matches
			? "dark"
			: "light";
		root.classList.add(systemTheme);
	} else {
		root.classList.add(theme);
	}
}

async function applyMaterial(material: AppearanceSettings["material"]) {
	if (!isTauri()) return;
	const { getCurrentWindow } = await import("@tauri-apps/api/window");
	const appWindow = getCurrentWindow();
	try {
		await appWindow.clearEffects();
		if (material === "mica") {
			await appWindow.setEffects({ effects: [Effect.Mica] });
		} else if (material === "acrylic") {
			await appWindow.setEffects({ effects: [Effect.Acrylic] });
		}
	} catch (error) {
		console.error("Failed to set window effects", error);
	}

	document.documentElement.dataset.material = material;
}

async function applyInterfaceFont(fontStr: string) {
	const root = document.documentElement;
	if (fontStr) {
		root.style.setProperty("--app-font-family", fontStr);
	} else {
		root.style.removeProperty("--app-font-family");
	}
}

function applyLyricFont(fontStr: string) {
	const root = document.documentElement;
	if (fontStr) {
		root.style.setProperty("--app-lyric-font-family", fontStr);
	} else {
		root.style.removeProperty("--app-lyric-font-family");
	}
}

async function applyAudioEngine(
	audio: AudioSettings,
	throwOnError = false,
) {
	if (!isTauri()) return;

	try {
		await Promise.all([
			corePlayer.setOutputDevice(audio.outputDeviceId),
			corePlayer.setReplayGain(
				audio.replayGainEnabled,
				audio.replayGainPreampDb,
			),
			corePlayer.setEqualizer(audio.equalizerEnabled, audio.equalizerGainsDb),
			corePlayer.setCrossfade(audio.crossfadeDuration),
		]);
	} catch (error) {
		console.error("Failed to apply native audio engine settings", error);
		if (throwOnError) throw error;
	}
}

export async function initSettings() {
	await useSettingStore.getState().loadSettings();

	const { appearance, audio } = useSettingStore.getState();
	applyTheme(appearance.theme);
	applyMaterial(appearance.material);
	applyInterfaceFont(appearance.font.interfaceFontStr);
	applyLyricFont(appearance.font.lyricFontStr);
	applyAudioEngine(audio);

	const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
	const handleSystemThemeChange = () => {
		if (useSettingStore.getState().appearance.theme === "system") {
			applyTheme("system");
		}
	};
	systemThemeMedia.addEventListener("change", handleSystemThemeChange);

	let unlistenAppearanceSync: (() => void) | undefined;
	if (isTauri()) {
		const { listen } = await import("@tauri-apps/api/event");
		unlistenAppearanceSync = await listen<AppearanceSettings>(
			APPEARANCE_SYNC_EVENT,
			(event) => {
				useSettingStore.setState((state) => ({
					appearance: {
						...state.appearance,
						...event.payload,
						font: {
							...state.appearance.font,
							...event.payload.font,
						},
					},
				}));
			},
		);
	}

	useSettingStore.subscribe((state, prevState) => {
		if (state.appearance.theme !== prevState.appearance.theme) {
			applyTheme(state.appearance.theme);
		}
		if (state.appearance.material !== prevState.appearance.material) {
			applyMaterial(state.appearance.material);
		}
		if (
			state.appearance.font.interfaceFontStr !==
			prevState.appearance.font.interfaceFontStr
		) {
			applyInterfaceFont(state.appearance.font.interfaceFontStr);
		}
		if (
			state.appearance.font.lyricFontStr !==
			prevState.appearance.font.lyricFontStr
		) {
			applyLyricFont(state.appearance.font.lyricFontStr);
		}
	});

	return () => {
		systemThemeMedia.removeEventListener("change", handleSystemThemeChange);
		unlistenAppearanceSync?.();
	};
}
