import { Album } from "./album";
import { Artist } from "./artist";

export type Level =
  | "standard" // 标准
  | "higher" // 较高
  | "exhign" // 极高
  | "lossless" // 无损
  | "hires" // Hi-Res
  | "jyeffect" // 高清环绕声
  | "sky" // 沉浸环绕声
  | "dolby" // 杜比全景声
  | "jymaster"; // 超清母带

export interface Quality {
  br: number; // 比特率
  vd: number; // 音量增益
  sr: number; // 采样率
  size: number; // 大小
}

export interface QualityWithKey extends Quality {
  key: string;
}

export interface Privilege {
  cs: boolean; // 是否为云盘歌曲
  st: number; // 小于 0 时为灰色歌曲, 使用上传云盘的方法解灰后 st == 0
  toast: boolean; // 是否「由于版权保护，您所在的地区暂时无法使用」
}

export interface Song {
  id: number; // 歌曲 ID
  name: string; // 歌曲标题
  mainTitle?: string;
  additionalTitle?: string;
  al: Album; // 专辑，如果是DJ节目(dj_type != 0)或者无专辑信息(single == 1)，则专辑 id 为 0
  album?: Album;
  dt: number; // 时长 ms
  duration?: number;
  ar: Artist[]; // 歌手列表
  alia?: string[]; // 别名列表 第一个别名会被显示为副标题
  cd?: number; // 表示歌曲属于专辑中第几张 CD，对应音频文件的 Tag
  no?: number; // 表示歌曲属于 CD 中第几曲，0 表示没有这个字段，对应音频文件的 Tag
  djId: 0 | number; // 0-不是 DJ 节目，其他-DJ 节目的 ID
  fee: 8 | 1 | 0; // 资费类型：8-购买专辑 1-VIP 0-免费或无版权
  st?: 0 | 1; // 状态：0-正常 1-下架
  originCoverType?: 0 | 1 | 2; // 0: 未知 1: 原唱 2: 翻唱
  originSongSimpleData?: Song; // 对于翻唱曲给出原曲简单格式的信息
  single?: 0 | 1; // 0: 有专辑或 DJ 节目 1: 未知专辑
  v?: number; // 歌曲当前信息版本
  l?: Quality; // 低品质
  m?: Quality; // 中品质
  h?: Quality; // 高品质
  sq?: Quality; // 无损
  hr?: Quality; // Hi-Res
  pop?: number; // [0.0, 100.0] 中离散的几个数值，表示歌曲热度
  t?: 0 | 1 | 2; // 0: 一般类型 1: 通过云盘上传的音乐，无公开对应 2: 通过云盘上传的音乐，有公开对应
}

export interface Lyric {
  version?: number;
  lyric?: string;
}

export interface SongLyric {
  lrc?: Lyric; // 文本歌词
  tlyric?: Lyric; // 翻译歌词
  romalrc?: Lyric; // 罗马音歌词
  yrc?: Lyric; // 逐字歌词
  ytlrc?: Lyric; // 翻译逐字歌词
  yromalrc?: Lyric; // 罗马音逐字歌词
}
