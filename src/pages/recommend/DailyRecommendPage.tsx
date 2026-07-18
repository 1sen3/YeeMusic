import { Play24Filled } from "@fluentui/react-icons";
import { useRef } from "react";
import useSWR from "swr";
import { Entrance } from "@/components/entrance";
import { PinnedBar, usePinned } from "@/components/pinned-bar";
import { PlaylistSongs } from "@/components/playlist/detail/playlist-songs";
import { Skeleton } from "@/components/ui/skeleton";
import { YeeButton } from "@/components/yee-button";
import { getDailyRecommend } from "@/lib/services/recommend";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";

const SKELETON_ROWS = ["a", "b", "c", "d", "e", "f", "g", "h"];

export function DailyRecommendPage() {
	const now = new Date();
	const month = now.getMonth() + 1;
	const day = now.getDate();

	// 与首页推荐卡片共用同一个 SWR key，互相命中缓存
	const { data, isLoading } = useSWR("dailyRecommend", getDailyRecommend, {
		revalidateOnFocus: false,
	});
	const songs = data ?? [];
	const { playQueue } = usePlayerStore();

	const headerRef = useRef<HTMLDivElement>(null);
	const isPinned = usePinned(headerRef);

	const firstSong = songs[0];

	return (
		<div className="flex h-full w-full flex-col py-8">
			{/* 日期与副标题是同一句话，间距收紧让它们读作一个整体 */}
			<div ref={headerRef} className="mb-8 flex flex-col gap-2 px-8">
				<Entrance>
					<p
						className="font-bold text-4xl tracking-tighter drop-shadow-lg"
						style={{ fontFamily: "寒蝉锦书宋" }}
					>
						{month} 月 {day} 日，
					</p>
				</Entrance>
				{firstSong && (
					<Entrance delay={0.06}>
						<p className="font-medium text-foreground/60 text-lg">
							从{firstSong.ar?.[0]?.name}的
							<span
								style={{ fontFamily: "寒蝉锦书宋" }}
								className="font-semibold"
							>
								《{firstSong.name}》
							</span>
							开始。
						</p>
					</Entrance>
				)}
			</div>

			<PinnedBar isPinned={isPinned} title={`${month} 月 ${day} 日 · 每日推荐`}>
				<Entrance delay={0.12} className="pl-8">
					<YeeButton
						variant="glass"
						size="lg"
						icon={<Play24Filled className="size-4" />}
						onClick={() => playQueue(songs)}
					/>
				</Entrance>

				{songs.length > 0 && (
					<Entrance delay={0.12} className="pr-8">
						<span className="text-foreground/50 text-sm">
							共 {songs.length} 首
						</span>
					</Entrance>
				)}
			</PinnedBar>

			{isLoading ? (
				<div className="flex flex-col gap-4 px-8">
					{SKELETON_ROWS.map((key) => (
						<Skeleton key={key} className="h-12 w-full" />
					))}
				</div>
			) : (
				<Entrance delay={0.18} className="relative px-8">
					<PlaylistSongs songs={songs} query="" />
				</Entrance>
			)}
		</div>
	);
}
