import { motion } from "framer-motion";
import { Suspense, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PinnedBar, usePinned } from "@/components/pinned-bar";
import { RecentAlbum } from "@/components/recent/recent-album";
import { RecentPlaylist } from "@/components/recent/recent-playlist";
import { RecentSong } from "@/components/recent/recent-song";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VALID_TABS = ["song", "playlist", "album"] as const;
type TabValue = (typeof VALID_TABS)[number];

function RecentPageContent() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const pathname = useLocation().pathname;

	// 页面顶部的哨兵元素：滚动超过阈值后 isPinned，顶栏浮现模糊层和标题
	const sentinelRef = useRef<HTMLDivElement>(null);
	const isPinned = usePinned(sentinelRef);

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
		<div className="relative flex min-h-full w-full flex-1 flex-col pb-8">
			<div
				ref={sentinelRef}
				aria-hidden="true"
				className="absolute top-4 left-0 h-px w-px"
			/>

			<PinnedBar isPinned={isPinned} title="最近播放">
				<div className="pl-8">
					<Tabs value={tabValue} onValueChange={setTabValue}>
						<TabsList>
							<TabsTrigger value="song">单曲</TabsTrigger>
							<TabsTrigger value="playlist">歌单</TabsTrigger>
							<TabsTrigger value="album">专辑</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			</PinnedBar>

			{/* tab 切换：内容即时替换 + 短淡入，不做位移 */}
			<motion.div
				key={tabValue}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.18 }}
				className="flex w-full flex-1 flex-col px-8"
			>
				{renderContent()}
			</motion.div>
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
