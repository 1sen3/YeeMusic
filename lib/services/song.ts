import { api } from "../api";
import { SONG_QUALITY } from "../constants/song";
import { Level, Privilege, Quality, Song } from "../types";

interface SongDetailResponse {
  code: number;
  songs: Song[];
  privileges: Privilege[];
}

interface SongUrlData {
  id: number;
  url: string; // 播放地址，有时效性，取决于 expi
  br: number; // 比特率 bps
  size: number; // 大小 byte
  md5: string;
  code: number;
  type: string; // 歌曲文件类型
  encondeType: string;
  expi: number; // 过期时间
  level: Level;
  fee: 0 | 1 | 8; // 资费类型：8-购买专辑 1-VIP 0-免费或无版权
  payed: 0 | 1; // 是否已付费: 0-未付 1-已付
  sr: number; // 采样率 hz
  gain: number; // 音轨增益
  peak: number; // 音频峰值
}

interface SongUrlResponse {
  code: number;
  data: SongUrlData[];
}

interface SongMusicDetailResponse {
  code: number;
  data: {
    l?: Quality;
    h?: Quality;
    m?: Quality;
    sq?: Quality;
    hr?: Quality;
    db?: Quality;
    jm?: Quality;
    je?: Quality;
    sk?: Quality;
  };
  message: string;
  success: boolean;
  error: boolean;
}

export async function getSongDetail(
  ids: string[],
): Promise<{ songs: Song[]; privileges: Privilege[] } | null> {
  if (!ids || ids.length === 0) return null;

  const idsStr = ids.join(",");
  const res = await api.get<SongDetailResponse>("/song/detail", {
    ids: idsStr,
  });

  if (res.code !== 200 || !res.songs) return null;

  return { songs: res.songs, privileges: res.privileges || [] };
}

export async function getSongUrl(
  id: string[],
  level: string,
  unblock: boolean = false,
) {
  const idStr = id.join(",");
  const res = await api.get<SongUrlResponse>("/song/url/v1", {
    id: idStr,
    level,
    unblock: unblock.toString(),
  });

  if (res.code !== 200 || !res.data.length) return [];

  return res.data;
}

// 歌曲音质详情
export async function getSongMusicDetail(id: string | number) {
  const res = await api.get<SongMusicDetailResponse>("/song/music/detail", {
    id: id.toString(),
  });

  const musicDetails = Object.entries(res.data)
    .map(([key, value]) => {
      if (Object.keys(SONG_QUALITY).includes(key) && value !== null)
        return {
          key,
          ...value,
        };
    })
    .filter((item) => item !== undefined)
    .sort((b, a) => a.size - b.size);

  return musicDetails;
}
