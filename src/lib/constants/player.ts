import { sfRepeat, sfRepeat1, sfShuffle } from "@bradleyhodges/sfsymbols";

export const REPEAT_MODE_LIST = [
  {
    type: "order",
    icon: sfRepeat,
    label: "顺序播放",
    next: "repeat",
    canShuffle: true,
  },
  {
    type: "repeat",
    icon: sfRepeat,
    label: "列表循环",
    next: "single",
    canShuffle: true,
  },
  {
    type: "single",
    icon: sfRepeat1,
    label: "单曲循环",
    next: "order",
    canShuffle: false,
  },
] as const;

export type RepeatType = (typeof REPEAT_MODE_LIST)[number]["type"];
export type RepeatMode = (typeof REPEAT_MODE_LIST)[number];

export const REPEAT_MODE_BY_TYPE = Object.fromEntries(
  REPEAT_MODE_LIST.map((q) => [q.type, q]),
) as Record<RepeatType, RepeatMode>;

export const SHUFFLE_MODE = [
  { type: "on", icon: sfShuffle, label: "随机" },
  { type: "off", icon: sfShuffle, label: "顺序" },
] as const;

export type ShuffleType = (typeof SHUFFLE_MODE)[number]["type"];
export type ShuffleMode = (typeof SHUFFLE_MODE)[number];

export const SHUFFLE_MODE_BY_TYPE = Object.fromEntries(
  SHUFFLE_MODE.map((q) => [q.type, q]),
) as Record<ShuffleType, ShuffleMode>;
