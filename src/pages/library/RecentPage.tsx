import { Suspense } from "react";
import { RecentAlbum } from "@/components/recent/recent-album";
import { RecentPlaylist } from "@/components/recent/recent-playlist";
import { RecentSong } from "@/components/recent/recent-song";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { BlurLayer } from "@/components/blur-layer";

const VALID_TABS = ["song", "playlist", "album"] as const;
type TabValue = (typeof VALID_TABS)[number];

function RecentPageContent() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  const tabParam = searchParams.get("tab");
  const tabValue: TabValue =
    tabParam && VALID_TABS.includes(tabParam as TabValue)
      ? (tabParam as TabValue)
      : "song";

  const setTabValue = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    navigate(`${pathname}?${params.toString()}`, { replace: true });
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
    <div className="w-full min-h-full px-0 pb-8 flex flex-col relative">
      <div
        className={cn(
          "flex gap-8 items-center shrink-0 sticky top-0 z-10 py-6",
        )}
      >
        <div className="px-8 z-10">
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

        <BlurLayer />
      </div>

      <div className="flex-1 w-full h-full px-8">{renderContent()}</div>
    </div>
  );
}

export default function RecentPage() {
  return (
    <Suspense>
      <RecentPageContent />
    </Suspense>
  );
}
