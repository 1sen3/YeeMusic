import { api } from "../api";
import { HomeBlock, RecentListenListData } from "../types/homepageData";

interface HomepageDataResponse {
  code: number;
  data: {
    cursor: unknown;
    blocks: HomeBlock[];
  };
  message: string;
}

interface RecentListenListResponse {
  code: number;
  data: RecentListenListData;
  message: string;
}

export async function getHomepageData(
  refresh: boolean = false,
): Promise<HomeBlock[]> {
  const res: HomepageDataResponse = await api.get<HomepageDataResponse>(
    "/homepage/block/page",
    {
      refresh: refresh.toString(),
    },
  );

  if (res.code !== 200 || !res.data || !res.data.blocks) return [];

  return res.data.blocks.filter(
    (block) =>
      block.blockCode !== "HOMEPAGE_BLOCK_OLD_DRAGON_BALL" &&
      block.blockCode !== "HOMEPAGE_BANNER",
  );
}

export async function getRecentListenListData() {
  const res: RecentListenListResponse = await api.get<RecentListenListResponse>(
    "/recent/listen/list",
  );

  if (res.code !== 200 || !res.data || !res.data.resources) return null;

  return res.data;
}
