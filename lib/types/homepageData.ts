import { Artist } from "./artist";
import { Song } from "./song";

export interface Button {
  text: string;
  action: string;
  actionType: string;
}

export interface UIElement {
  mainTitle?: { title: string };
  subTitle?: { title: string };
  image?: {
    imageUrl: string;
  };
  labelTexts?: string[];
  button?: Button;
}

export interface ResourceExtInfo {
  artists?: Artist[];
  song?: Song;
  playCount?: number;
  highQuality?: boolean;
  hasListened: false;
}

export interface Resource {
  resourceId: string;
  resourceType: "list" | "song";
  uiElement?: UIElement;
  resourceExtInfo: ResourceExtInfo;
}

export interface CreativeExtInfoVO {
  playCount?: number;
}

export interface creative {
  creativeType:
    | "SONG_LIST_HOMEPAGE"
    | "list"
    | "voicelist"
    | "scroll_playlist"
    | "NEW_SONG_HOMEPAGE"
    | "DIGITAL_ALBUM_HOMEPAGE";
  creativeId?: string;
  uiElement?: UIElement;
  resources?: Resource[];
  creativeExtInfoVO?: CreativeExtInfoVO;
}

export interface Banner {
  pic: string;
  targetId: number;
  targetType: number;
  typeTitle: string;
  url: string | null;
  titleColor: string;
  bannerId: string;
}

export interface HomeBlock {
  blockCode: string;
  uiElement?: UIElement;
  showType:
    | "HOMEPAGE_SLIDE_PLAYLIST" // 歌单列表
    | "HOMEPAGE_SLIDE_SONGLIST_ALIGN" // 歌曲列表
    | "HOMEPAGE_NEW_SONG_NEW_ALBUM" // 新歌
    | "BANNER" // 轮播图
    | "DRAGON_BALL" // 首页的圆形图标入口（如每日推荐、私人 FM）
    | "SLIDE_RCMDLIKE_VOICELIST" // 播客/声音列表
    | "HOMPAGE_VIP_SONG_RCMD"; // VIP 歌曲推荐
  creatives?: creative[];
  extInfo?: {
    banners?: Banner[];
  };
}

// 最近常听
export interface RecentListenResourece {
  resourceId: number;
  resourceType: string;
  title: string;
  tag: string;
  coverUrlList: string[];
  playOrUpdateTime: number;
}

export interface RecentListenListData {
  title: string;
  resources: RecentListenResourece[];
}
