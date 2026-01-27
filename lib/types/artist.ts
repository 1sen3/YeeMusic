interface Rank {
  rank: number; // 歌手榜单排名?
  type: number; // 排名趋势? 1-上升 2-下降 3-持平 4-新上榜
}

export interface Artist {
  id: number;
  name: string;
  cover?: string; // 歌手主页大图？
  avatar?: string; // 歌手头像
  tns?: string[]; // 译名
  transNames?: string[]; // 译名
  identities?: string[]; // 身份
  identifyTag?: string[]; // 认证标签
  briefDesc?: string; // 介绍
  alias?: string[]; // 别名
  rank?: Rank; // 排名
  albumSize?: number; // 专辑数量
  musicSize?: number; // 歌曲数量
  mvSize?: number; // mv 数量
}
