"use client";

import { Suspense } from "react";
import { RecentAlbum } from "@/components/recent/recent-album";
import { RecentPlaylist } from "@/components/recent/recent-playlist";
import { RecentSong } from "@/components/recent/recent-song";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

const VALID_TABS = ["song", "playlist", "album"] as const;
type TabValue = (typeof VALID_TABS)[number];

function RecentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab");
  const tabValue: TabValue =
    tabParam && VALID_TABS.includes(tabParam as TabValue)
      ? (tabParam as TabValue)
      : "song";

  const setTabValue = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const renderContent = () => {
    switch (tabValue) {
      case "song":
        return <RecentSong />;
      case "playlist":
        return <RecentPlaylist />;
      case "album":
        return <RecentAlbum />;
    }
  };

  return (
    <div className="w-full min-h-full px-8 pb-8 flex flex-col relative">
      <div
        className={cn(
          "flex justify-between items-center shrink-0 sticky top-0 z-10 py-6",
          "before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-[calc(100%)]",
          "before:bg-linear-to-b before:from-background before:via-background/80 before:to-transparent",
          "before:pointer-events-none before:-z-1",
        )}
      >
        <Tabs
          defaultValue={tabValue.toString()}
          value={tabValue}
          onValueChange={(v) => setTabValue(v)}
        >
          <TabsList>
            <TabsTrigger value="song">单曲</TabsTrigger>
            <TabsTrigger value="playlist">歌单</TabsTrigger>
            <TabsTrigger value="album">专辑</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 w-full h-full">{renderContent()}</div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <RecentPageContent />
    </Suspense>
  );
}
