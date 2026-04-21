import {
  ArrowRepeat120Regular,
  ArrowRepeatAll20Regular,
  ArrowRepeatAllOff20Regular,
  ArrowShuffle20Regular,
  ArrowShuffleOff20Regular,
} from "@fluentui/react-icons";

export const REPEAT_MODE_CONFIG = {
  order: {
    icon: ArrowRepeatAllOff20Regular,
    desc: "顺序播放",
    next: "repeat",
    canShuffle: true,
  },
  repeat: {
    icon: ArrowRepeatAll20Regular,
    desc: "列表循环",
    next: "single",
    canShuffle: true,
  },
  single: {
    icon: ArrowRepeat120Regular,
    desc: "单曲循环",
    next: "order",
    canShuffle: false,
  },
} as const;

export type repeatModeKey = keyof typeof REPEAT_MODE_CONFIG;

export const SHUFFLE_CONFIG = {
  on: {
    icon: ArrowShuffle20Regular,
    desc: "随机",
  },
  off: {
    icon: ArrowShuffleOff20Regular,
    desc: "顺序",
  },
};
