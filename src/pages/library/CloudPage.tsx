import {
	ArrowUpload24Regular,
	Cloud24Regular,
	CloudArrowUp24Regular,
	Dismiss24Regular,
	Play24Filled,
	Search24Filled,
} from "@fluentui/react-icons";
import { motion } from "framer-motion";
import Pinyin from "pinyin-match";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import useSWR from "swr";
import { PinnedBar, usePinned } from "@/components/pinned-bar";
import { SongList } from "@/components/song/song-list";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YeeButton } from "@/components/yee-button";
import { getUserCloudAll } from "@/lib/services/cloud";
import { useCloudStore } from "@/lib/store/cloudStore/cloudStore";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import type { CloudUploadTask } from "@/lib/types";
import { cn } from "@/lib/utils";

const VALID_TABS = ["uploaded", "uploading"] as const;
type TabValue = (typeof VALID_TABS)[number];

// 云盘支持的音频格式
const UPLOAD_ACCEPT = ".mp3,.flac,.ape,.wma,.wav,.ogg,.aac,.m4a";

function matchesPinyin(text: string, q: string): boolean {
	return text.toLowerCase().includes(q) || !!Pinyin.match(text, q);
}

function formatBytes(bytes: number): string {
	if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
	if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
	return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatSpeed(bps: number): string {
	if (bps >= 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
	return `${(bps / 1024).toFixed(0)} KB/s`;
}

function UploadingList() {
	const uploadTasks = useCloudStore((s) => s.uploadTasks);
	const tasks = Array.from(uploadTasks.values());

	if (tasks.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
				<CloudArrowUp24Regular className="size-10 opacity-30" />
				<span className="text-sm">暂无上传任务</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{tasks.map((task, idx) => (
				<UploadingRow key={task.id} task={task} index={idx} />
			))}
		</div>
	);
}

function UploadingRow({
	task,
	index,
}: {
	task: CloudUploadTask;
	index: number;
}) {
	const { fileName, status, uploaded, total, speed, errorMsg } = task;
	const cancelUpload = useCloudStore((s) => s.cancelUpload);

	const progress = total > 0 ? (uploaded / total) * 100 : 0;

	const statusLabel: Record<CloudUploadTask["status"], string> = {
		pending: "等待中",
		uploading: "上传中",
		done: "已完成",
		error: errorMsg ?? "上传失败",
	};

	return (
		<div
			className={cn(
				"p-3 rounded-md grid grid-cols-[32px_1fr_1fr_32px] hover:bg-foreground/8 items-center",
				index % 2 === 0 ? "bg-foreground/5" : "",
			)}
		>
			<p className="size-4 flex items-center justify-center text-sm font-bold text-muted-foreground">
				{index + 1}
			</p>

			<div className="flex gap-4 items-center min-w-0">
				<div className="size-10 rounded-sm bg-foreground/5 flex items-center justify-center shrink-0">
					<CloudArrowUp24Regular className="size-5 text-muted-foreground" />
				</div>

				<div className="flex flex-col min-w-0">
					<p className="line-clamp-1 w-full font-semibold text-sm">
						{fileName}
					</p>
					<span className="text-xs text-foreground/60">
						{formatBytes(total)}
					</span>
				</div>
			</div>

			<div className="min-w-0 flex items-center gap-2 justify-end">
				<div className="w-1/2 h-1 bg-foreground/10 rounded-full overflow-hidden">
					<div
						className={cn(
							"h-full rounded-full transition-all duration-300",
							status === "error" ? "bg-destructive" : "bg-primary",
						)}
						style={{ width: `${status === "done" ? 100 : progress}%` }}
					/>
				</div>
				<span
					className={cn(
						"text-xs shrink-0 max-w-40 truncate",
						status === "error" && "text-destructive",
					)}
					title={status === "error" ? statusLabel.error : undefined}
				>
					{status === "uploading" && speed > 0
						? formatSpeed(speed)
						: statusLabel[status]}
				</span>
			</div>

			{status !== "done" && (
				<button
					type="button"
					className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
					title={status === "error" ? "移除" : "取消上传"}
					onClick={() => cancelUpload(task.id)}
				>
					<Dismiss24Regular className="size-4" />
				</button>
			)}
		</div>
	);
}

function CloudPageContent() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const pathname = useLocation().pathname;

	const isLoggedin = useUserStore((s) => s.isLoggedin);
	const playQueue = usePlayerStore((s) => s.playQueue);
	const uploadFiles = useCloudStore((s) => s.uploadFiles);

	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	// 页面顶部的哨兵元素：滚动超过阈值后 isPinned，顶栏浮现模糊层和标题
	const sentinelRef = useRef<HTMLDivElement>(null);
	const isPinned = usePinned(sentinelRef);

	const {
		data: cloudData,
		isLoading,
		mutate,
	} = useSWR(isLoggedin ? "user-cloud" : null, () => getUserCloudAll(), {
		revalidateOnFocus: false,
	});

	// 上传成功后刷新云盘列表
	useEffect(() => {
		const handleUploaded = () => {
			mutate();
		};
		window.addEventListener("cloud-song-uploaded", handleUploaded);
		return () =>
			window.removeEventListener("cloud-song-uploaded", handleUploaded);
	}, [mutate]);

	const tabParam = searchParams.get("tab");
	const tabValue: TabValue =
		tabParam && VALID_TABS.includes(tabParam as TabValue)
			? (tabParam as TabValue)
			: "uploaded";

	const setTabValue = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		navigate(`${pathname}?${params.toString()}`, { replace: true });
	};

	const songs = cloudData?.songs ?? [];
	const query = searchQuery.trim().toLowerCase();
	const filteredSongs = useMemo(() => {
		if (!query) return songs;
		return songs.filter(
			(s) =>
				matchesPinyin(s.name, query) ||
				(s.al?.name && matchesPinyin(s.al.name, query)) ||
				s.ar?.some((a) => matchesPinyin(a.name, query)),
		);
	}, [songs, query]);

	const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? []);
		// 重置 value，保证取消后重新选择同一文件仍触发 change
		e.target.value = "";
		if (!files.length) return;

		uploadFiles(files);
		setTabValue("uploading");
	};

	return (
		<div className="relative flex min-h-full w-full flex-1 flex-col pb-8">
			<div
				ref={sentinelRef}
				aria-hidden="true"
				className="absolute top-4 left-0 h-px w-px"
			/>

			<input
				ref={fileInputRef}
				type="file"
				accept={UPLOAD_ACCEPT}
				multiple
				className="hidden"
				onChange={handleSelectFiles}
			/>

			<PinnedBar isPinned={isPinned} title="网盘">
				<div className="pl-8">
					<Tabs value={tabValue} onValueChange={setTabValue}>
						<TabsList>
							<TabsTrigger value="uploaded">已上传单曲</TabsTrigger>
							<TabsTrigger value="uploading">正在上传</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<div className="flex items-center gap-4 pr-8">
					<YeeButton
						variant="glass"
						size="lg"
						disabled={songs.length === 0}
            onClick={() => playQueue(songs)}
						className="text-primary!"
						content={
							<div className="flex items-center justify-center gap-2 px-2">
								<Play24Filled className="size-4" />
								<span>播放</span>
							</div>
						}
					/>
					<YeeButton
						variant="glass"
						size="lg"
						disabled={!isLoggedin}
						onClick={() => fileInputRef.current?.click()}
						content={
							<div className="flex items-center justify-center gap-2 px-2">
								<ArrowUpload24Regular className="size-4" />
								<span>上传</span>
							</div>
						}
					/>

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
			</PinnedBar>

			{/* tab 切换：内容即时替换 + 短淡入，不做位移 */}
			<motion.div
				key={tabValue}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.18 }}
				className="flex w-full flex-1 flex-col px-8"
			>
				{tabValue === "uploaded" ? (
					<>
						{!isLoggedin ? (
							<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
								<Cloud24Regular className="size-10 opacity-30" />
								<span className="text-sm">登录后可查看云盘音乐</span>
							</div>
						) : isLoading ? (
							<div className="flex flex-1 items-center justify-center text-foreground/50">
								<Spinner />
							</div>
						) : songs.length === 0 ? (
							<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
								<Cloud24Regular className="size-10 opacity-30" />
								<span className="text-sm">云盘还没有歌曲</span>
							</div>
						) : (
							<>
								<p className="mb-4 text-xs text-foreground/50">
									共 {cloudData?.count ?? songs.length} 首 · 已用{" "}
									{formatBytes(cloudData?.size ?? 0)} /{" "}
									{formatBytes(cloudData?.maxSize ?? 0)}
								</p>
								{filteredSongs.length === 0 ? (
									<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
										<Search24Filled className="size-10 opacity-30" />
										<span className="text-sm">未找到匹配的歌曲</span>
									</div>
								) : (
									<SongList
										songList={filteredSongs}
										showCover={true}
										showAlbum={true}
									/>
								)}
							</>
						)}
					</>
				) : (
					<UploadingList />
				)}
			</motion.div>
		</div>
	);
}

export default function CloudPage() {
	return (
		<Suspense>
			<CloudPageContent />
		</Suspense>
	);
}
