import { get, set, del } from "idb-keyval";
import { StateStorage } from "zustand/middleware";

const lastSavedString: Record<string, string> = {};

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (lastSavedString[name] === value) {
      return;
    }
    lastSavedString[name] = value;
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};
