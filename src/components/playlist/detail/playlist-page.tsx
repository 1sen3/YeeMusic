import { BlurLayer } from "@/components/blur-layer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { YeeButton } from "@/components/yee-button";
import { Popover, PopoverItem } from "@/components/yee-popover";
import { SONG_SORT_OPTIONS } from "@/lib/constants/song";
import { subscribePlaylist } from "@/lib/services/playlist";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { Playlist, Song } from "@/lib/types";
import { cn, formateDate } from "@/lib/utils";
import {
	ChevronDown24Regular,
	Heart24Filled,
	Heart24Regular,
	LockClosed24Filled,
	Play24Filled,
	Search24Filled,
} from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlaylistDeleteButton } from "../playlist-delete-button";
import { PlaylistEditButton } from "../playlist-edit-button";
import { PlaylistSongs } from "./playlist-songs";

export function PlaylistPage({
	playlist,
	songs,
	isSongsLoading = false,
	isMyPlaylist,
	onRefresh,
}: {
	playlist: Playlist;
	songs: Song[];
	isSongsLoading?: boolean;
	isMyPlaylist: boolean;
	onRefresh?: () => void;
}) {
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("date");
	const [isPinned, setIsPinned] = useState(false);

	const headerRef = useRef<HTMLDivElement>(null);
	const playList = usePlayerStore((s) => s.playList);

	const playlistId = playlist.id;
	const isFavList = isMyPlaylist && playlist.specialType === 5;
	const title = isFavList ? "我喜欢的音乐" : playlist.name;
	const coverImgUrl = playlist.coverImgUrl;

	const creatorName = playlist.creator.nickname;
	const creatorAvatarUrl = playlist.creator.avatarUrl;
	const createTime = playlist.createTime;

	const toggleLikePlaylist = useUserStore((s) => s.toggleLikePlaylist);
	const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);
	const isSubscribed = subscribedPlaylists.some((pl) => pl.id === playlist.id);
	const LikeIcon = isSubscribed ? Heart24Filled : Heart24Regular;
	const isPrivacy = playlist.privacy === 10;
	const isLoggedin = useUserStore((s) => s.isLoggedin);

	async function handleLike() {
		const targetState = !isSubscribed;
		toggleLikePlaylist(playlist, targetState);
		try {
			const res = await subscribePlaylist(targetState ? 1 : 2, playlistId);
			if (!res) {
				toggleLikePlaylist(playlist, isSubscribed);
				toast.error("操作失败，请重试", { position: "top-center" });
			}
		} catch (err) {
			console.error("切换歌单喜欢状态失败", err);
			toggleLikePlaylist(playlist, isSubscribed);
			toast.error("操作失败，请重试", { position: "top-center" });
		}
	}

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
	}, []);

	return (
		<div className="flex h-full w-full flex-col">
			<div className="mb-8 flex items-center gap-8 px-8" ref={headerRef}>
				<div className="relative h-44 w-44 flex-none overflow-hidden rounded-md bg-zinc-100 drop-shadow-2xl">
					<img
						src={coverImgUrl}
						alt={`${title} 封面`}
						className="object-cover"
					/>
				</div>
				<div className="flex flex-col gap-6">
					<span className="flex items-center gap-2 font-semibold text-2xl select-text">
						{title}
						{isPrivacy && (
							<LockClosed24Filled className="size-6 text-black/40" />
						)}
					</span>
					<div className="flex flex-col gap-4">
						<div className="flex items-center gap-2">
							<Avatar className="size-6 drop-shadow-md">
								<AvatarImage src={creatorAvatarUrl} />
								<AvatarFallback>CN</AvatarFallback>
							</Avatar>
							<span className="text-foreground/80">{creatorName}</span>
						</div>
						<span className="text-foreground/60 text-sm">
							{formateDate(createTime)}
						</span>
					</div>
				</div>
			</div>

			<div
				className={cn(
					"sticky top-0 z-10 flex shrink-0 items-center justify-between pt-6 pb-10",
				)}
			>
				<div className="z-10 flex gap-4 pl-8">
					<YeeButton
						variant="glass"
						onClick={() => {
							playList(playlistId, "list");
						}}
						size="lg"
						disabled={playlist.trackCount === 0}
						content={
							<div className="flex w-26 items-center justify-center gap-2">
								<Play24Filled className="size-4" />
								<span>播放</span>
							</div>
						}
					/>
					{isMyPlaylist && !isFavList && (
						<>
							<PlaylistEditButton playlist={playlist} onSuccess={onRefresh} />
							<PlaylistDeleteButton playlist={playlist} />
						</>
					)}
					{!isMyPlaylist && (
						<YeeButton
							variant="glass"
							size="lg"
							icon={
								<LikeIcon
									className={cn("size-4", isSubscribed && "text-red-500")}
								/>
							}
							onClick={() => {
								if (!isLoggedin) {
									toast.error("请先登录网易云账号");
									return;
								}
								handleLike();
							}}
						/>
					)}
				</div>
				<div className="z-10 flex items-center gap-4 pr-8">
					<Popover
						trigger={
							<div className="flex items-center gap-2 rounded-sm px-4 py-2 hover:bg-foreground/5">
								<span className="font-light text-sm">排序方式：</span>
								<span className="font-semibold text-primary text-sm">
									{SONG_SORT_OPTIONS[sortOption]}
								</span>
								<ChevronDown24Regular className="size-4 text-foreground/60" />
							</div>
						}
					>
						{Object.entries(SONG_SORT_OPTIONS).map(([val, label]) => (
							<PopoverItem
								key={val}
								isActive={sortOption === val}
								onClick={() => setSortOption(val)}
							>
								{label}
							</PopoverItem>
						))}
					</Popover>

					<div className="relative flex items-center">
						<Search24Filled className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-foreground/60" />
						<Input
							showIndicator={false}
							placeholder={searchOpen ? "搜索..." : ""}
							className={cn(
								"h-9 rounded-full border-transparent bg-transparent! text-foreground",
								"focus:border-transparent focus:ring-0!",
								"transition-all duration-300 ease-in-out",
								searchOpen ? "w-48 pl-8" : "w-9",
							)}
							containerClassName="rounded-full yee-glass-surface"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setSearchOpen(true)}
							onBlur={() => {
								if (!searchQuery) setSearchOpen(false);
							}}
						/>
					</div>
				</div>

				{isPinned && <BlurLayer />}
			</div>

			<div className="relative px-8">
				<PlaylistSongs
					songs={songs}
					query={searchQuery}
					sort={sortOption}
					isLoading={isSongsLoading}
				/>
			</div>
		</div>
	);
}
