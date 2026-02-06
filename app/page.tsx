"use client";

import { useEffect, useState, useCallback } from "react";
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

export default function Page() {
  const [homepageData, setHomepageData] = useState<HomeBlock[] | null>(null);
  const [recentListenList, setRecentListenList] =
    useState<RecentListenListData | null>(null);

  const [isLoad, setIsLoad] = useState<boolean>(false);
  const { setOnRefresh, setIsRefreshing } = useTitlebar();

  const handleRefreshBlocks = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setIsLoad(true);
      const homepageBlocks = await getHomepageData(true);
      const recentListenListData = await getRecentListenListData();
      setHomepageData(homepageBlocks);
      setRecentListenList(recentListenListData);
      setIsLoad(false);
      setIsRefreshing(false);
    } catch (err) {
      console.log(err);
      setIsRefreshing(false);
    }
  }, [setIsRefreshing]);

  useEffect(() => {
    // 注册刷新回调
    setOnRefresh(handleRefreshBlocks);
    return () => {
      setOnRefresh(null);
    };
  }, [setOnRefresh, handleRefreshBlocks]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoad(true);
        const homepageBlocks = await getHomepageData(true);
        const recentListenListData = await getRecentListenListData();
        setHomepageData(homepageBlocks);
        setRecentListenList(recentListenListData);
        setIsLoad(false);
      } catch (err) {
        console.log(err);
      }
    }

    fetchData();
  }, []);

  return (
    <>
      {isLoad ? (
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
