export interface AlbumArtist {
  id: number;
  name: string;
}

export interface AlbumSong {
  id: number;
  name: string;
  ar: AlbumArtist[];
  no: number;
  dt: number; // 时长 ms
  fee: number; // 是否为VIP 歌曲
}

export interface Album {
  id: number;
  name: string;
  picUrl: string;
  publishTime: number;
  description: string;
  artists: AlbumArtist[];
  size: number;
}

export interface AlbumDetails extends Album {
  songs: AlbumSong[];
  company?: string;
  subType?: string;
}