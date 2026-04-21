import { create } from "zustand";
import { isTauri } from "@tauri-apps/api/core";
import { Effect } from "@tauri-apps/api/window";
import { getSettingsStore } from "./settingStore/settings.persistence";
import { QualityKey } from "../constants/song";

export interface MeshGradientSettings {
  distortion: number;
  swirl: number;
  grainMixer: number;
  grainOverlay: number;
  speed: number;
}

export interface FontSettings {
  interfaceFontStr: string;
  lyricFontStr: string;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  material: "acrylic" | "mica" | "none";
  meshGradient: MeshGradientSettings;
  font: FontSettings;
}

export interface AudioSettings {
  preferQuality: QualityKey;
}

const defaultAppearanceSettings: AppearanceSettings = {
  theme: "system",
  material: "mica",
  meshGradient: {
    distortion: 0.5,
    swirl: 0.2,
    grainMixer: 0,
    grainOverlay: 0,
    speed: 0.2,
  },
  font: {
    interfaceFontStr: "",
    lyricFontStr: "",
  },
};

type SettingStore = {
  appearance: AppearanceSettings;
  audio: AudioSettings;
  hydrated: boolean;

  setTheme: (theme: AppearanceSettings["theme"]) => void;
  setMaterial: (material: AppearanceSettings["material"]) => void;
  updateMeshGradient: (patch: Partial<MeshGradientSettings>) => void;
  updateFont: (patch: Partial<FontSettings>) => void;

  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetAppearance: () => Promise<void>;

  setPreferQuality: (quality: QualityKey) => Promise<void>;
};

export const useSettingStore = create<SettingStore>((set, get) => ({
  appearance: defaultAppearanceSettings,
  audio: {
    preferQuality: "l",
  },
  hydrated: false,

  setTheme: (theme) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        theme,
      },
    }));
    get().saveSettings();
  },

  setMaterial: (material) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        material,
      },
    }));
    get().saveSettings();
  },

  updateMeshGradient: (patch) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        meshGradient: {
          ...state.appearance.meshGradient,
          ...patch,
        },
      },
    }));
    get().saveSettings();
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
  },

  loadSettings: async () => {
    const store = await getSettingsStore();
    const savedAppearance = await store.get<AppearanceSettings>("appearance");
    const savedAudio = await store.get<AudioSettings>("audio");

    set({
      appearance: savedAppearance
        ? {
            ...defaultAppearanceSettings,
            ...savedAppearance,
            meshGradient: {
              ...defaultAppearanceSettings.meshGradient,
              ...savedAppearance.meshGradient,
            },
          }
        : defaultAppearanceSettings,
      audio: savedAudio ? { ...get().audio, ...savedAudio } : get().audio,
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
  },

  setPreferQuality: async (quality: QualityKey) => {
    const store = await getSettingsStore();
    set({ audio: { preferQuality: quality } });
    await store.set("audio", get().audio);
    await store.save();
  },
}));

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

export async function initSettings() {
  await useSettingStore.getState().loadSettings();

  const { appearance } = useSettingStore.getState();
  applyTheme(appearance.theme);
  applyMaterial(appearance.material);
  applyInterfaceFont(appearance.font.interfaceFontStr);
  applyLyricFont(appearance.font.lyricFontStr);

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
}
