import { api } from "../api";
import { QUALITY_BY_KEY } from "../constants/song";
import {
  Level,
  Privilege,
  Quality,
  Song,
  SongLyric,
  SongQualityDetail,
} from "../types";

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

interface SongLyricResponse extends SongLyric {
  code: number;
}

interface CheckMusicResponse {
  code: number;
  success: boolean;
  message: string;
}

interface UnblockMusicResponse {
  code: number;
  data: string;
  proxyUrl: string;
}

interface DownloadMusicResponse {
  code: number;
  data: {
    id: number;
    url: string;
    size: number;
    br: number;
    md5: string;
    code: number;
    expi: number;
    type: string;
    gain: number;
    peak: number;
    closedGain: number;
    closedPeak: number;
    fee: number;
    uf: number;
    payed: number;
    canExtend: boolean;
    level: string;
    encodeType: string;
    freeTrialPrivilege: {
      resConsumable: boolean;
      userConsumable: boolean;
    };
    freeTimeTrialPrivilege: {
      resConsumable: boolean;
      userConsumable: boolean;
    };
    time: number;
    musicId: string;
    sr: number;
  };
}

export async function getSongDetail(ids: string[] | number[]): Promise<Song[]> {
  if (!ids || ids.length === 0) return [];

  const idsStr = ids.join(",");
  const res = await api.get<SongDetailResponse>("/song/detail", {
    ids: idsStr,
  });

  if (!res.songs) return [];

  res.songs.forEach((song, index) => {
    song.privilege = res.privileges[index];
  });

  return res.songs;
}

export async function getSongUrl(
  id: string[],
  level: string,
  unblock: boolean = false,
  signal?: AbortSignal,
) {
  const idStr = id.join(",");
  const res = await api.get<SongUrlResponse>(
    "/song/url/v1",
    {
      id: idStr,
      level,
      unblock: unblock.toString(),
    },
    { signal },
  );

  if (res.code !== 200 || !res.data.length) return [];

  return res.data;
}

// 歌曲音质详情
export async function getSongMusicDetail(
  id: string | number,
  signal?: AbortSignal,
) {
  const res = await api.get<SongMusicDetailResponse>(
    "/song/music/detail",
    {
      id: id.toString(),
    },
    { signal },
  );

  const musicDetails: SongQualityDetail[] = Object.entries(res.data)
    .filter(
      (entry): entry is [string, Quality] =>
        entry[0] in QUALITY_BY_KEY && entry[1] !== null,
    )
    .map(([key, quality]) => ({
      ...QUALITY_BY_KEY[key as keyof typeof QUALITY_BY_KEY],
      ...quality,
    }))
    .sort((a, b) => b.weight - a.weight);

  return musicDetails;
}

// 获取歌词
export async function getSongLyric(id: string | number, signal?: AbortSignal) {
  return await api.get<SongLyricResponse>(
    "/lyric/new",
    {
      id: id.toString(),
    },
    { signal },
  );
}

// 检查歌曲资源是否有效
export async function checkMusic(id: string | number, signal?: AbortSignal) {
  return await api.get<CheckMusicResponse>(
    "/check/music",
    {
      id: id.toString(),
    },
    { signal },
  );
}

// 获取灰色歌曲链接
export async function unblockMusic(id: string | number, signal?: AbortSignal) {
  return await api.get<UnblockMusicResponse>(
    "/song/url/match",
    {
      id: id.toString(),
    },
    { signal },
  );
}

// 获取客户端歌曲下载链接 - 新版
// 使用 /song/url/v1 接口获取的是歌曲试听 url, 非 VIP 账号最高只能获取 极高 音质，但免费类型的歌曲(fee == 0)使用本接口可最高获取Hi-Res音质的 url。
export async function downloadMusic(id: number | string, level: string) {
  const res = await api.get<DownloadMusicResponse>("/song/download/url/v1", {
    id: id.toString(),
    level,
  });

  if (res.code !== 200) return null;

  return res.data;
}
