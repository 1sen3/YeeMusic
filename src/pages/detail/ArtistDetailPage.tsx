import { ArtistAlbum } from "@/components/artist/detail/artist-album";
import { ArtistDesc } from "@/components/artist/detail/artist-desc";
import { ArtistSimilar } from "@/components/artist/detail/artist-similar";
import { ArtistSong } from "@/components/artist/detail/artist-songs";
import { BlurLayer } from "@/components/blur-layer";
import { Loading } from "@/components/loading";
import { ArtistSkeleton } from "@/components/skeleton/artist-skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YeeButton } from "@/components/yee-button";
import { getArtistDetail } from "@/lib/services/artist";
import { subArtist } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { Artist } from "@/lib/types";
import { GetThumbnail, cn } from "@/lib/utils";
import {
	Heart24Filled,
	Heart24Regular,
	Play24Filled,
	Search24Regular,
} from "@fluentui/react-icons";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

function ArtistContent() {
	const [isLoading, setIsLoading] = useState(false);
	const [searchParams] = useSearchParams();
	const id = searchParams.get("id");
	const [artist, setArtist] = useState<Artist | null>(null);
	const [tabValue, setTabValue] = useState("song");
	const [isPinned, setIsPinned] = useState(false);

	const headerRef = useRef<HTMLDivElement>(null);

	const [searchQuery, setSearchQuery] = useState("");
	const [searchOpen, setSearchOpen] = useState(false);

	const playArtist = usePlayerStore((s) => s.playArtist);

	const artistListSet = useUserStore((s) => s.artistListSet);
	const toggleLikeArtist = useUserStore((s) => s.toggleLikeArtist);
	const isLike = artistListSet.has(Number(id));
	const likeIcon = isLike ? (
		<Heart24Filled className="size-4 text-red-500" />
	) : (
		<Heart24Regular className="size-4" />
	);

	const isLoggedin = useUserStore((s) => s.isLoggedin);

	useEffect(() => {
		async function fetchArtistDetail() {
			setIsLoading(true);
			if (!id) return;
			try {
				const res = await getArtistDetail(id);
				setArtist(res);
			} catch (err) {
				console.error(err);
			} finally {
				setIsLoading(false);
			}
		}
		fetchArtistDetail();
	}, [id]);

	useEffect(() => {
		const root = document.getElementById("main-scroll-container");
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsPinned(!entry.isIntersecting);
			},
			{
				root,
				rootMargin: "-10px 0px 0px 0px",
				threshold: 0,
			},
		);

		if (headerRef.current) {
			observer.observe(headerRef.current);
		}

		return () => observer.disconnect();
	}, [isLoading]);

	async function toggleLike() {
		const targetLike = !isLike;

		toggleLikeArtist(artist!, targetLike);

		try {
			const res = await subArtist(id!, targetLike ? 1 : 2);

			if (!res) {
				toggleLikeArtist(artist!, isLike);
				toast.error("操作失败，请稍后重试...", { position: "top-center" });
			}
		} catch (err) {
			toggleLikeArtist(artist!, isLike);
			toast.error("操作失败，请稍后重试...", { position: "top-center" });
		}
	}

	const renderContent = (searchQuery?: string) => {
		switch (tabValue) {
			case "song":
				return <ArtistSong artistId={artist!.id} searchQuery={searchQuery} />;
			case "album":
				return <ArtistAlbum artistId={artist!.id} searchQuery={searchQuery} />;
			case "mv":
				return <div>开发中...</div>;
			case "desc":
				return <ArtistDesc artistId={artist!.id} />;
			case "similar":
				return <ArtistSimilar artistId={artist!.id} />;
		}
	};

	if (!id) return <div className="p-8">未找到歌手</div>;
	if (isLoading || !artist) return <ArtistSkeleton />;

	return (
		<div className="flex flex-col">
			<div
				className="relative h-114 w-full flex-none overflow-hidden bg-zinc-100 drop-shadow-xl"
				ref={headerRef}
			>
				<img
					src={GetThumbnail(artist.avatar!, 1280)}
					alt={artist.name}
					className="absolute inset-0 h-full w-full object-cover object-[center_40%]"
				/>

				<div className="absolute inset-0 bg-linear-to-b from-transparent from-60% to-black/25" />

				<div className="absolute bottom-0 left-0 flex w-full items-center justify-between p-8">
					<div className="flex flex-col gap-2">
						<span className="font-semibold text-3xl text-white text-shadow-lg select-text">
							{artist.name}
						</span>
					</div>
					<div className="flex gap-4">
						<YeeButton
							variant="glass"
							size="lg"
							onClick={() => playArtist(artist.id.toString())}
							icon={<Play24Filled className="size-4" />}
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
				</div>
			</div>
			<div className="flex min-h-screen w-full flex-col gap-4 py-4">
				<div
					className={cn(
						"sticky top-0 z-10 flex shrink-0 items-center justify-between py-6",
					)}
				>
					<div className="z-10 px-8">
						<Tabs value={tabValue} onValueChange={(v) => setTabValue(v)}>
							<TabsList>
								<TabsTrigger value="song">歌曲</TabsTrigger>
								<TabsTrigger value="album">专辑</TabsTrigger>
								<TabsTrigger value="mv">MV</TabsTrigger>
								<TabsTrigger value="desc">歌手详情</TabsTrigger>
								<TabsTrigger value="similar">相似歌手</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{isPinned && <BlurLayer />}

					{["song", "album"].includes(tabValue) && (
						<div className="relative flex items-center pr-8">
							<Search24Regular className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-foreground/80" />
							<Input
								placeholder={searchOpen ? "搜索..." : ""}
								className={cn(
									"h-9 rounded-full border-transparent bg-transparent! text-foreground",
									"focus:border-transparent focus:ring-0!",
									"transition-all duration-300 ease-in-out",
									searchOpen ? "w-48 pl-8" : "w-9",
								)}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onFocus={() => setSearchOpen(true)}
								onBlur={() => {
									if (!searchQuery) setSearchOpen(false);
								}}
								containerClassName="rounded-full yee-glass-surface"
								showIndicator={false}
							/>
						</div>
					)}
				</div>

				<div className="h-full w-full flex-1 px-8">
					{renderContent(searchQuery)}
				</div>
			</div>
		</div>
	);
}

export default function ArtistDetailPage() {
	return (
		<Suspense
			fallback={
				<div>
					<Loading />
				</div>
			}
		>
			<ArtistContent />
		</Suspense>
	);
}
