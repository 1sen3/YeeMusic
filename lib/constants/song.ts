import {
  Heart24Filled,
  Heart24Regular,
  HeartOff24Regular,
} from "@fluentui/react-icons";

export const SONG_QUALITY = {
  l: {
    level: "standard",
    desc: "标准",
    color:
      "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-500 hover:text-white",
  },
  m: {
    level: "higher",
    desc: "较高",
    color:
      "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-600 hover:text-white",
  },
  h: {
    level: "exhigh",
    desc: "极高",
    color:
      "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white",
  },
  sq: {
    level: "lossless",
    desc: "无损",
    color:
      "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white",
  },
  hr: {
    level: "hires",
    desc: "Hi-Res",
    color:
      "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white",
  },
  je: {
    level: "jyeffect",
    desc: "高清环绕声",
    color:
      "bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-600 hover:text-white",
  },
  sk: {
    level: "sky",
    desc: "沉浸环绕声",
    color:
      "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white",
  },
  db: {
    level: "dolby",
    desc: "杜比全景声",
    color:
      "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white",
  },
  jm: {
    level: "jymaster",
    desc: "超清母带",
    color:
      "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white",
  },
} as const;

export const LIKE_ICON = {
  like: Heart24Filled,
  unlike: Heart24Regular,
  dislike: HeartOff24Regular,
} as const;
