import {
  Heart24Filled,
  Heart24Regular,
  HeartOff24Regular,
} from "@fluentui/react-icons";

export const SONG_SORT_OPTIONS: Record<string, string> = {
  date: "添加时间",
  name: "歌名",
  artist: "歌手",
  album: "专辑",
  duration: "时长",
} as const;

export type SongSortKey = keyof typeof SONG_SORT_OPTIONS;

export const LIKE_ICON = {
  like: Heart24Filled,
  unlike: Heart24Regular,
  dislike: HeartOff24Regular,
} as const;

export const QUALITY_LIST = [
  { key: "l", level: "standard", desc: "标准", weight: 0 },
  { key: "m", level: "higher", desc: "较高", weight: 1 },
  { key: "h", level: "exhigh", desc: "极高", weight: 2 },
  { key: "sq", level: "lossless", desc: "无损", weight: 3 },
  { key: "hr", level: "hires", desc: "Hi-Res", weight: 4 },
  { key: "je", level: "jyeffect", desc: "高清环绕声", weight: 5 },
  { key: "sk", level: "sky", desc: "沉浸环绕声", weight: 6 },
  { key: "db", level: "dolby", desc: "杜比全景声", weight: 7 },
  { key: "jm", level: "jymaster", desc: "超清母带", weight: 8 },
  { key: "unlock", level: "unlock", desc: "UNLOCK", weight: -1 },
] as const;

export type QualityKey = (typeof QUALITY_LIST)[number]["key"];
export type QualityLevel = (typeof QUALITY_LIST)[number]["level"];
export type QualityOption = (typeof QUALITY_LIST)[number];

export const QUALITY_BY_KEY = Object.fromEntries(
  QUALITY_LIST.map((q) => [q.key, q]),
) as Record<QualityKey, QualityOption>;

export const QUALITY_BY_LEVEL = Object.fromEntries(
  QUALITY_LIST.map((q) => [q.level, q]),
) as Record<QualityLevel, QualityOption>;

export const needsDowngrade = (preferKey: QualityKey, maxKey: QualityKey) => {
  return QUALITY_BY_KEY[preferKey].weight > QUALITY_BY_KEY[maxKey].weight;
};
