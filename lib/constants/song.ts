export const SONG_QUALITY = {
  standard: "标准",
  higher: "较高",
  exhigh: "极高",
  lossless: "无损",
  hires: "Hi-Res",
  jyeffect: "高清环绕声",
  sky: "沉浸环绕声",
  dolby: "杜比全景声",
  jymaster: "超清母带",
} as const;

export const SONG_QUALITY_STYLES = {
  standard:
    "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-500 hover:text-white",
  higher:
    "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-600 hover:text-white",
  exhigh:
    "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600 hover:text-white",
  lossless:
    "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white",
  hires:
    "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white",
  jyeffect:
    "bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-600 hover:text-white",
  sky: "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white",
  dolby:
    "bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-600 hover:text-white",
  jymaster:
    "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600 hover:text-white",
} as const;
