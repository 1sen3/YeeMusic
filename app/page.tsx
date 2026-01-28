"use client";

import { useEffect, useState, useCallback } from "react";
import { HomeBlock, RecentListenListData } from "@/lib/types";
import { Section } from "./components/section";
import { SongPreview } from "./components/song-preview";
import {
  getHomepageData,
  getRecentListenListData,
} from "@/lib/services/homepage";
import { PlaylistCard } from "./components/playlist-card";
import { VoicePreview } from "./components/voice-preview";
import { RecentListenCard } from "./components/recent-listen-card";
import { Spinner } from "@/components/ui/spinner";
import { Loading } from "@/components/loading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { useTitlebar } from "@/contexts/titlebar-context";
import { motion } from "framer-motion";
import { SlideAndFadePage } from "@/components/slide-and-fade-page";

export default function Page() {
  const [homepageData, setHomepageData] = useState<HomeBlock[] | null>(null);
  const [recentListenList, setRecentListenList] =
    useState<RecentListenListData | null>(null);

  const [isLoad, setIsLoad] = useState<boolean>(false);
  const { setTitle, setOnRefresh, setIsRefreshing } = useTitlebar();

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
    // 设置标题
    setTitle("主页");
    // 注册刷新回调
    setOnRefresh(handleRefreshBlocks);

    // 组件卸载时清除
    return () => {
      setOnRefresh(null);
    };
  }, [setTitle, setOnRefresh, handleRefreshBlocks]);

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
        <div className="w-full min-h-full px-8 py-8 flex flex-col gap-8">
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
