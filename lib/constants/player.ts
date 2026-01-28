import {
  ArrowRepeat124Regular,
  ArrowRepeatAll24Regular,
  ArrowRepeatAllOff24Regular,
  ArrowShuffle24Regular,
  ArrowShuffleOff24Regular,
} from "@fluentui/react-icons";

export const REPEAT_MODE_CONFIG = {
  order: {
    icon: ArrowRepeatAllOff24Regular,
    desc: "顺序播放",
    next: "repeat",
    canShuffle: true,
  },
  repeat: {
    icon: ArrowRepeatAll24Regular,
    desc: "列表循环",
    next: "single",
    canShuffle: true,
  },
  single: {
    icon: ArrowRepeat124Regular,
    desc: "单曲循环",
    next: "order",
    canShuffle: false,
  },
} as const;

export const SHUFFLE_CONFIG = {
  on: {
    icon: ArrowShuffle24Regular,
    desc: "随机",
  },
  off: {
    icon: ArrowShuffleOff24Regular,
    desc: "顺序",
  },
};
