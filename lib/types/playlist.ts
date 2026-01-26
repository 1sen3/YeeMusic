import { UserProfile } from './user';

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
}
