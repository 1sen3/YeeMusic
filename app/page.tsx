"use client";

import { useEffect } from "react";
import { HomeBlock, RecentListenListData } from "@/lib/types";
import { Section } from "../components/home/section";
import { SongPreview } from "../components/home/song-preview";
import {
  getHomepageData,
  getRecentListenListData,
} from "@/lib/services/homepage";
import { PlaylistCard } from "../components/home/playlist-card";
import { VoicePreview } from "../components/home/voice-preview";
import { RecentListenCard } from "../components/home/recent-listen-card";
import { Loading } from "@/components/loading";
import { useTitlebar } from "@/contexts/titlebar-context";
import { SlideAndFadePage } from "@/components/slide-and-fade-page";
import useSWR from "swr";

export default function Page() {
  const { setOnRefresh, setIsRefreshing } = useTitlebar();

  const {
    data: homepageData,
    isLoading: isLoadingHomepage,
    mutate: mutateHomepage,
  } = useSWR<HomeBlock[]>("homepage", () => getHomepageData(true));

  const {
    data: recentListenList,
    isLoading: isLoadingRecent,
    mutate: mutateRecent,
  } = useSWR<RecentListenListData | null>(
    "recentListen",
    getRecentListenListData,
  );

  const isLoading = isLoadingHomepage || isLoadingRecent;

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

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="w-full min-h-full h-full px-8 py-8 flex flex-col gap-8">
          {recentListenList && (
            <Section title={recentListenList.title}>
              {recentListenList.resources.map((res, idx) => (
                <RecentListenCard resource={res} key={idx} />
              ))}
            </Section>
          )}

          {homepageData?.map((blocks, idx) => (
            <SlideAndFadePage key={idx}>
              <Section
                title={blocks.uiElement?.subTitle?.title || ""}
                itemsPerPage={
                  blocks.showType === "HOMEPAGE_SLIDE_SONGLIST_ALIGN" ||
                  blocks.showType === "HOMPAGE_VIP_SONG_RCMD"
                    ? 2
                    : undefined
                }
                seeMore={blocks?.uiElement?.button?.text.includes("更多")}
              >
                {blocks.showType === "HOMEPAGE_SLIDE_PLAYLIST" &&
                  blocks?.creatives?.map((creative) => (
                    <PlaylistCard
                      resource={creative?.resources?.[0] || null}
                      key={creative.creativeId}
                    />
                  ))}

                {(blocks.showType === "HOMEPAGE_SLIDE_SONGLIST_ALIGN" ||
                  blocks.showType === "HOMPAGE_VIP_SONG_RCMD") &&
                  blocks?.creatives?.map((creative, idx) => (
                    <SongPreview
                      key={idx}
                      resources={creative?.resources || []}
                    />
                  ))}

                {blocks.showType === "SLIDE_RCMDLIKE_VOICELIST" &&
                  blocks?.creatives && (
                    <>
                      <VoicePreview creatives={blocks.creatives.slice(0, 3)} />
                      <VoicePreview creatives={blocks.creatives.slice(3, 6)} />
                    </>
                  )}
              </Section>
            </SlideAndFadePage>
          ))}
        </div>
      )}
    </>
  );
}
