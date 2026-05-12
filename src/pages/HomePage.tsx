import { useEffect } from "react";
import { HomeBlock, RecentListenListData } from "@/lib/types";
import { Section } from "@/components/home/section";
import {
  getHomepageData,
  getRecentListenListData,
} from "@/lib/services/homepage";
import { useTitlebar } from "@/contexts/titlebar-context";
import useSWR from "swr";
import { RecentListenSection } from "@/components/home/recent-listen-section";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { RecommendAndFMSection } from "@/components/home/recommend-and-fm-section";
import { HomeSkeleton } from "@/components/skeleton/home-skeleton";

export default function Page() {
  const { setOnRefresh, setIsRefreshing } = useTitlebar();
  const { isLoggedin } = useUserStore();

  const {
    data: homepageData,
    isLoading: isLoadingHomepage,
    mutate: mutateHomepage,
  } = useSWR<HomeBlock[]>("homepage", () => getHomepageData(true), {
    revalidateOnFocus: false,
  });

  const {
    data: recentListenList,
    isLoading: isLoadingRecent,
    mutate: mutateRecent,
  } = useSWR<RecentListenListData | null>(
    "recentListen",
    getRecentListenListData,
    {
      revalidateOnFocus: false,
    },
  );

  const isLoading = isLoadingHomepage || isLoadingRecent;

  // 当登录状态变化时自动刷新
  useEffect(() => {
    mutateHomepage();
    mutateRecent();
  }, [isLoggedin, mutateHomepage, mutateRecent]);

  // 注册刷新回调
  useEffect(() => {
    setOnRefresh(async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([mutateHomepage(), mutateRecent()]);
      } finally {
        setIsRefreshing(false);
      }
    });
    return () => setOnRefresh(null);
  }, [setOnRefresh, setIsRefreshing, mutateHomepage, mutateRecent]);

  if (isLoading) return <HomeSkeleton />;

  return (
    <div className="w-full min-h-full h-full px-8 py-8 flex flex-col gap-12">
      <RecommendAndFMSection />

      {recentListenList && (
        <RecentListenSection resources={recentListenList.resources} />
      )}

      {homepageData?.map((block) => (
        <Section block={block} />
      ))}
    </div>
  );
}
