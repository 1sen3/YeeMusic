import { useUserStore } from "@/lib/store/userStore/userStore";
import { Playlist } from "@/lib/types";
import {
	Add20Regular,
	ArrowDownload20Filled,
	ArrowDownload20Regular,
	Clock20Filled,
	Clock20Regular,
	Cloud20Filled,
	Cloud20Regular,
	FluentIcon,
	Folder20Filled,
	Folder20Regular,
	Heart20Filled,
	Heart20Regular,
	Home20Filled,
	Home20Regular,
	List24Regular,
	Settings20Regular,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PlaylistAddForm } from "./modal/playlist-add-form";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarSeparator,
} from "./ui/sidebar";

const mainItems = [
	{
		title: "主页",
		url: "/",
		icon: Home20Regular,
		activeIcon: Home20Filled,
	},
];

const libraryItems = [
	{
		title: "最近播放",
		url: "/library/recent",
		icon: Clock20Regular,
		activeIcon: Clock20Filled,
	},
	{
		title: "下载",
		url: "/library/download",
		icon: ArrowDownload20Regular,
		activeIcon: ArrowDownload20Filled,
	},
	{
		title: "本地歌曲",
		url: "/library/local",
		icon: Folder20Regular,
		activeIcon: Folder20Filled,
	},
	{
		title: "网盘",
		url: "/library/cloud",
		icon: Cloud20Regular,
		activeIcon: Cloud20Filled,
	},
];

export function AppSidebar() {
	const isLoggedin = useUserStore((s) => s.isLoggedin);
	const favPlaylist = useUserStore((s) => s.favPlaylist);
	const createdPlaylists = useUserStore((s) => s.createdPlaylists);
	const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);

	const location = useLocation();
	const pathName = location.pathname;
	const [searchParams] = useSearchParams();
	const currentId = searchParams.get("id");

	const [isPlaylistAddOpen, setIsPlaylistAddOpen] = useState(false);
	const indicatorRootRef = useRef<HTMLDivElement>(null);
	const itemRefs = useRef(new Map<string, HTMLLIElement>());
	const [indicator, setIndicator] = useState({
		visible: false,
		top: 0,
		height: 24,
	});

	const favPlaylistUrl = `/detail/playlist?id=${favPlaylist?.id}`;

	const isItemActive = (item: {
		title: string;
		url: string;
		icon: FluentIcon;
		activeIcon: FluentIcon;
	}) => {
		if (item.url && item.url !== "#") {
			return pathName === item.url || pathName.startsWith(`${item.url}/`);
		}

		return false;
	};

	const isPlaylistActive = (playlist: Playlist) => {
		const isMatchedPath =
			pathName === "/detail/playlist" || pathName === "/detail/playlist/";

		return isMatchedPath && currentId === String(playlist.id);
	};

	const favoriteActive =
		(favPlaylist && isPlaylistActive(favPlaylist)) || false;
	const activeKey = useMemo(() => {
		const mainItem = mainItems.find(isItemActive);
		if (mainItem) return mainItem.url;

		const libraryItem = libraryItems.find(isItemActive);
		if (libraryItem) return libraryItem.url;

		if (favoriteActive) return "favorite";
		if (pathName === "/setting") return "setting";

		return null;
	}, [favoriteActive, pathName]);

	const setItemRef = useCallback(
		(key: string) => (node: HTMLLIElement | null) => {
			if (node) {
				itemRefs.current.set(key, node);
			} else {
				itemRefs.current.delete(key);
			}
		},
		[],
	);

	const updateIndicator = useCallback(() => {
		if (!activeKey || !indicatorRootRef.current) {
			setIndicator((current) => ({ ...current, visible: false }));
			return;
		}

		const activeItem = itemRefs.current.get(activeKey);
		if (!activeItem) {
			setIndicator((current) => ({ ...current, visible: false }));
			return;
		}

		const rootRect = indicatorRootRef.current.getBoundingClientRect();
		const itemRect = activeItem.getBoundingClientRect();
		const height = 24;

		setIndicator({
			visible: true,
			top: itemRect.top - rootRect.top + (itemRect.height - height) / 2,
			height,
		});
	}, [activeKey]);

	useLayoutEffect(() => {
		updateIndicator();

		const root = indicatorRootRef.current;
		if (!root) return;

		const resizeObserver = new ResizeObserver(updateIndicator);
		resizeObserver.observe(root);
		itemRefs.current.forEach((item) => resizeObserver.observe(item));

		return () => resizeObserver.disconnect();
	}, [updateIndicator]);

	return (
		<>
			<Sidebar
				variant="sidebar"
				collapsible="icon"
				className="absolute! h-full!"
				onContextMenu={(e) => {
					e.preventDefault();
				}}
			>
				<div
					ref={indicatorRootRef}
					className="relative flex size-full flex-col"
				>
					<motion.div
						className="pointer-events-none absolute left-2 z-20 w-1 rounded-full bg-primary"
						animate={{
							opacity: indicator.visible ? 1 : 0,
							y: indicator.top,
							height: indicator.height,
						}}
						transition={{
							type: "spring",
							stiffness: 500,
							damping: 38,
							mass: 0.8,
						}}
					/>

					<SidebarContent>
						<SidebarGroup>
							<SidebarGroupContent className="-mt-2">
								<SidebarMenu>
									{mainItems.map((item) => (
										<SidebarMenuItem
											key={item.title}
											ref={setItemRef(item.url)}
										>
											<Link to={item.url} draggable={false}>
												<SidebarMenuButton
													isActive={isItemActive(item)}
													label={item.title}
													icon={
														isItemActive(item) ? (
															<item.activeIcon className="size-5 text-primary" />
														) : (
															<item.icon className="size-5" />
														)
													}
												/>
											</Link>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarSeparator className="mx-2! w-auto!" />

						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenu>
									{libraryItems.map((item) => (
										<SidebarMenuItem
											key={item.title}
											ref={setItemRef(item.url)}
										>
											<Link
												to={item.url}
												draggable={false}
												onClick={(e) => {
													if (item.title === "最近播放" && !isLoggedin) {
														e.preventDefault();
														toast.error("请先登录网易云账号");
													}
												}}
											>
												<SidebarMenuButton
													isActive={isItemActive(item)}
													label={item.title}
													icon={
														isItemActive(item) ? (
															<item.activeIcon className="size-5 text-primary" />
														) : (
															<item.icon className="size-5" />
														)
													}
												/>
											</Link>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>

						<SidebarSeparator className="mx-2! w-auto!" />

						<SidebarGroup>
							<SidebarGroupContent>
								<SidebarMenuItem ref={setItemRef("favorite")}>
									<Link
										to={favPlaylistUrl}
										draggable={false}
										onClick={(e) => {
											if (!isLoggedin) {
												e.preventDefault();
												toast.error("请先登录网易云账号");
											}
										}}
									>
										<SidebarMenuButton
											isActive={favoriteActive}
											icon={
												favoriteActive ? (
													<Heart20Filled className="size-5 text-primary" />
												) : (
													<Heart20Regular className="size-5" />
												)
											}
											label="喜爱歌曲"
										/>
									</Link>
								</SidebarMenuItem>

								<SidebarMenuItem>
									<Popover>
										<PopoverTrigger asChild>
											<SidebarMenuButton
												icon={<List24Regular />}
												label="歌单"
											/>
										</PopoverTrigger>
										<PopoverContent
											side="right"
											className="bg-card/80 backdrop-blur-md"
										>
											<div
												className="flex items-center gap-2 rounded-sm p-2 select-none hover:bg-foreground/5"
												onClick={(e) => {
													e.stopPropagation();
													if (!isLoggedin) {
														toast.error("暂不支持创建本地歌单，请登录后重试");
														return;
													}

													setIsPlaylistAddOpen(true);
												}}
											>
												<div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-sm">
													<Add20Regular className="size-4!" />
												</div>
												<span className="text-sm text-foreground/60">
													新建歌单
												</span>
											</div>

											{createdPlaylists.map((playlist) => (
												<div
													key={playlist.id}
													className="rounded-sm p-2 select-none hover:bg-foreground/5"
												>
													<Link to={`/detail/playlist?id=${playlist.id}`}>
														<div className="flex items-center gap-2">
															<div className="relative size-6 overflow-hidden rounded-sm">
																<img
																	src={playlist.coverImgUrl}
																	alt={`${playlist.name} 歌单封面`}
																	className="size-6"
																/>
															</div>
															<span>{playlist.name}</span>
														</div>
													</Link>
												</div>
											))}

											{subscribedPlaylists.map((playlist) => (
												<div
													key={playlist.id}
													className="rounded-sm p-2 select-none hover:bg-foreground/5"
												>
													<Link to={`/detail/playlist?id=${playlist.id}`}>
														<div className="flex items-center gap-2">
															<div className="relative size-6 overflow-hidden rounded-sm">
																<img
																	src={playlist.coverImgUrl}
																	alt={`${playlist.name} 歌单封面`}
																	className="size-6"
																/>
															</div>
															<span>{playlist.name}</span>
														</div>
													</Link>
												</div>
											))}
										</PopoverContent>
									</Popover>
								</SidebarMenuItem>
							</SidebarGroupContent>
						</SidebarGroup>
					</SidebarContent>

					<SidebarFooter>
						<SidebarMenu>
							<SidebarMenuItem ref={setItemRef("setting")}>
								<Link to="/setting" draggable={false}>
									<SidebarMenuButton
										isActive={pathName === "/setting"}
										icon={<Settings20Regular />}
										label="设置"
									/>
								</Link>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarFooter>
				</div>
			</Sidebar>

			<PlaylistAddForm
				open={isPlaylistAddOpen}
				onOpenChange={setIsPlaylistAddOpen}
			/>
		</>
	);
}
