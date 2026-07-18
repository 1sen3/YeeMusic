import {
	Heart24Filled,
	Heart24Regular,
	Play24Filled,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";
import { Suspense, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR from "swr";
import { AlbumDesc } from "@/components/album/detail/album-desc";
import { AlbumSongs } from "@/components/album/detail/album-songs";
import { Entrance } from "@/components/entrance";
import { PinnedBar, usePinned } from "@/components/pinned-bar";
import { AlbumSkeleton } from "@/components/skeleton/album-skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YeeButton } from "@/components/yee-button";
import { getAlbum } from "@/lib/services/album";
import { subAlbum } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { formateDate } from "@/lib/utils";

function AlbumContent() {
	const [searchParams] = useSearchParams();
	const id = searchParams.get("id");
	const [tabValue, setTabValue] = useState("song");
	const playList = usePlayerStore((s) => s.playList);

	// SWR 缓存：返回导航时即时命中，不再重新请求
	const { data: album, isLoading } = useSWR(
		id ? (["album", id] as const) : null,
		([, albumId]) => getAlbum(albumId),
		{ revalidateOnFocus: false },
	);

	const headerRef = useRef<HTMLDivElement>(null);
	const isPinned = usePinned(headerRef, !!album);

	const isLoggedin = useUserStore((s) => s.isLoggedin);
	const albumListSet = useUserStore((s) => s.albumListSet);
	const toggleLikeAlbum = useUserStore((s) => s.toggleLikeAlbum);
	const isLike = albumListSet.has(Number(id));
	const likeIcon = isLike ? (
		<Heart24Filled className="size-4 text-red-500" />
	) : (
		<Heart24Regular className="size-4" />
	);

	async function toggleLike() {
		if (!album || !id) return;

		const targetLike = !isLike;
		toggleLikeAlbum(album, targetLike);

		try {
			const res = await subAlbum(id, targetLike ? 1 : 2);
			if (!res) {
				toggleLikeAlbum(album, isLike);
				toast.error("操作失败，请稍后重试...", { position: "top-center" });
			}
		} catch {
			toggleLikeAlbum(album, isLike);
			toast.error("操作失败，请稍后重试...", { position: "top-center" });
		}
	}

	const renderContent = () => {
		if (!album) return null;
		switch (tabValue) {
			case "song":
				return <AlbumSongs songs={album.songs ?? []} />;
			case "desc":
				return <AlbumDesc desc={album.description ?? ""} />;
		}
	};

	if (!id) return <div className="p-8">未找到专辑</div>;

	if (isLoading || !album) return <AlbumSkeleton />;

	return (
		<div className="w-full h-full py-8 flex flex-col">
			<div className="flex gap-8 items-center mb-8 px-8" ref={headerRef}>
				<Entrance className="flex-none">
					<div className="w-44 h-44 relative rounded-md overflow-hidden bg-zinc-100 drop-shadow-xl">
						<img
							src={album.picUrl ?? ""}
							alt={album.name}
							className="object-cover"
						/>
					</div>
				</Entrance>

				<Entrance delay={0.06} className="flex flex-col gap-4">
					<span className="text-2xl font-bold tracking-tight text-foreground select-text">
						{album.name}
					</span>
					<div className="flex flex-col gap-2">
						<div>
							{album.artists?.map((ar, index) => (
								<Link
									key={`${ar.id}`}
									to={`/detail/artist?id=${ar.id}`}
									className="text-primary hover:text-primary/60 text-lg font-medium"
								>
									{ar.name}
									{index !== (album.artists?.length ?? 0) - 1 && "、"}
								</Link>
							))}
						</div>
						{album.publishTime && (
							<span className="text-foreground/60 text-sm">
								{formateDate(album.publishTime)}
							</span>
						)}
					</div>
				</Entrance>
			</div>

			<PinnedBar isPinned={isPinned} title={album.name}>
				<div className="pl-8">
					<Tabs value={tabValue} onValueChange={(v) => setTabValue(v)}>
						<TabsList>
							<TabsTrigger value="song">歌曲</TabsTrigger>
							<TabsTrigger value="desc">专辑详情</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<div className="flex gap-4 pr-8">
					<YeeButton
						variant="glass"
						size="lg"
						onClick={() => playList(id, "album")}
						content={
							<div className="w-26 flex gap-2 items-center justify-center">
								<Play24Filled className="size-4" />
								<span>播放</span>
							</div>
						}
					/>
					<YeeButton
						variant="glass"
						size="lg"
						icon={likeIcon}
						onClick={() => {
							if (!isLoggedin) {
								toast.error("请先登录网易云账号");
								return;
							}
							toggleLike();
						}}
					/>
				</div>
			</PinnedBar>

			{/* tab 切换：内容即时替换 + 短淡入，不做位移 */}
			<motion.div
				key={tabValue}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.18 }}
				className="flex-1 w-full h-full px-8"
			>
				{renderContent()}
			</motion.div>
		</div>
	);
}

export default function AlbumDetailPage() {
	return (
		<Suspense fallback={<AlbumSkeleton />}>
			<AlbumContent />
		</Suspense>
	);
}
