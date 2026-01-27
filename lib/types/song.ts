import { Album } from "./album";
import { Artist } from "./artist";

export interface Quality {
  br?: number; // 比特率
  vd?: number; // 音量增益
  sr?: number; // 采样率
  size?: number; // 大小
}

export interface Song {
  id: number;
  name: string;
  mainTitle?: string;
  additionalTitle?: string;
  al: Album; // 专辑
  dt: number; // 时长
  ar: Artist[]; // 歌手列表
  alia?: string[]; // 译名
  cd?: number; // cd 序号
  no?: number; // 歌曲在 cd 中的序号
  fee: number; // 资费类型：8-非 VIP 可点播 1-VIP 0-免费
  st?: number; // 状态：0-正常 1-下架
  v?: number; // 版本
  l?: Quality; // 低品质
  m?: Quality; // 中品质
  h?: Quality; // 高品质
  sq?: Quality; // 无损
  hr?: Quality; // Hi-Res
}
