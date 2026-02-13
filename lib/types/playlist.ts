import { Song } from "./song";
import { UserProfile } from "./user";

enum PlaylistSpecialType {
  Normal = 0,
  Fav = 5,
}

export interface Playlist {
  id: number;
  name: string;
  tags: string[];
  description: string;
  playCount: number;
  coverImgUrl: string;
  updateTime: number;
  trackCount: number;
  trackUpdateTime: number;
  totalDuration: number;
  userId: number;
  opRecommend?: boolean;
  recommendInfo?: string;
  creator: UserProfile;
  tracks?: Song[];
  specialType: PlaylistSpecialType | number;
}
