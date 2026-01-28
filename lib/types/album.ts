import { Artist } from "./artist";
import { Song } from "./song";

interface AlbumInfo {
  liked: boolean; // 是否收藏
}

export interface Album {
  id: number;
  name: string;
  picUrl: string;
  publishTime?: number; // 发行时间
  description?: string; // 描述
  artists?: Artist[]; // 歌手列表
  size?: number; // 大小（歌曲数量）
  subType?: string; // 分类，如“录音室版”
  tags?: string[]; // 标签
  type?: string; // 类型，如“专辑”
  info?: AlbumInfo; // 专辑有关信息
  songs?: Song[];
}
