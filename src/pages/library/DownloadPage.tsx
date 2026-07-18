import {
	ArrowDownload24Regular,
	Document24Regular,
	Folder24Regular,
	Pause24Filled,
	Play24Filled,
} from "@fluentui/react-icons";
import { openPath } from "@tauri-apps/plugin-opener";
import { motion } from "framer-motion";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PinnedBar, usePinned } from "@/components/pinned-bar";
import { SongList } from "@/components/song/song-list";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { YeeButton } from "@/components/yee-button";
import {
	DownloadedSongToLocalTrack,
	LocalTrackToSong,
} from "@/lib/services/localMusic";
import { useDownloadStore } from "@/lib/store/downloadStore/downloadStore";
import type { DownloadTask } from "@/lib/types";
import { cn } from "@/lib/utils";

const VALID_TABS = ["downloaded", "downloading"] as const;
type TabValue = (typeof VALID_TABS)[number];

function formatSpeed(bps: number): string {
	if (bps >= 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
	return `${(bps / 1024).toFixed(0)} KB/s`;
}

function DownloadedList() {
	const downloadedSongs = useDownloadStore((s) => s.downloadedSongs);
	const songs = useMemo(
		() =>
			downloadedSongs.map((item) =>
				LocalTrackToSong(DownloadedSongToLocalTrack(item)),
			),
		[downloadedSongs],
	);

	if (downloadedSongs.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
				<Document24Regular className="size-10 opacity-30" />
				<span className="text-sm">暂无已下载歌曲</span>
			</div>
		);
	}

	return <SongList songList={songs} showCover={true} showAlbum={true} />;
}

function ActiveDownloadList() {
	const activeTasks = useDownloadStore((s) => s.activeTasks);
	const tasks = Array.from(activeTasks.values());

	if (tasks.length === 0) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
				<ArrowDownload24Regular className="size-10 opacity-30" />
				<span className="text-sm">暂无下载任务</span>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{tasks.map((task, idx) => (
				<ActiveDownloadRow key={task.songId} task={task} index={idx} />
			))}
		</div>
	);
}

function ActiveDownloadRow({
	task,
	index,
}: {
	task: DownloadTask;
	index: number;
}) {
	const { song, status, downloaded, total, speed } = task;
	const pauseDownload = useDownloadStore((s) => s.pauseDownload);
	const resumeDownload = useDownloadStore((s) => s.resumeDownload);

	const artists = song.ar.map((a) => a.name).join(" / ");
	const progress = total > 0 ? (downloaded / total) * 100 : 0;

	const statusLabel: Record<DownloadTask["status"], string> = {
		pending: "等待中",
		downloading: "下载中",
		paused: "已暂停",
		done: "已完成",
		error: "下载失败",
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

			<div className="flex gap-4 items-center">
				<img
					src={song.al.picUrl + "?param=48y48"}
					alt={song.al.name}
					className="size-10 rounded-sm object-cover shrink-0"
				/>

				<div className="flex flex-col">
					<p className="line-clamp-1 w-full font-semibold text-sm">
						{song.name}
					</p>
					<span className="text-xs text-foreground/60">{artists}</span>
				</div>
			</div>

			<div className="min-w-0 flex items-center gap-2 justify-end">
				<div className="w-1/2 h-1 bg-foreground/10 rounded-full overflow-hidden">
					<div
						className={cn(
							"h-full rounded-full transition-all duration-300",
							status === "error"
								? "bg-destructive"
								: status === "paused"
									? "bg-yellow-500"
									: "bg-primary",
						)}
						style={{ width: `${progress}%` }}
					/>
				</div>
				<span className="text-xs shrink-0">
					{status === "downloading" ? formatSpeed(speed) : statusLabel[status]}
				</span>
			</div>

			{status === "downloading" && (
				<button
					className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
					title="暂停"
					onClick={() => pauseDownload(task.songId)}
				>
					<Pause24Filled className="size-4" />
				</button>
			)}
			{status === "paused" && (
				<button
					className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors shrink-0"
					title="继续下载"
					onClick={() => resumeDownload(task.songId)}
				>
					<Play24Filled className="size-4" />
				</button>
			)}
		</div>
	);
}

function DownloadPageContent() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const pathname = useLocation().pathname;
	const loadFromStore = useDownloadStore((s) => s.loadFromStore);
	const downloadDir = useDownloadStore((s) => s.downloadDir);

	// 页面顶部的哨兵元素：滚动超过阈值后 isPinned，顶栏浮现模糊层和标题
	const sentinelRef = useRef<HTMLDivElement>(null);
	const isPinned = usePinned(sentinelRef);

	useEffect(() => {
		loadFromStore();
	}, []);

	const tabParam = searchParams.get("tab");
	const tabValue: TabValue =
		tabParam && VALID_TABS.includes(tabParam as TabValue)
			? (tabParam as TabValue)
			: "downloaded";

	const setTabValue = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("tab", value);
		navigate(`${pathname}?${params.toString()}`, { replace: true });
	};

	return (
		<div className="relative flex min-h-full w-full flex-1 flex-col pb-8">
			<div
				ref={sentinelRef}
				aria-hidden="true"
				className="absolute top-4 left-0 h-px w-px"
			/>

			<PinnedBar isPinned={isPinned} title="下载">
				<div className="pl-8">
					<Tabs value={tabValue} onValueChange={setTabValue}>
						<TabsList>
							<TabsTrigger value="downloaded">已下载</TabsTrigger>
							<TabsTrigger value="downloading">正在下载</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<div className="pr-8">
					<YeeButton
						icon={<Folder24Regular />}
						variant="glass"
						size="lg"
						onClick={() => openPath(downloadDir)}
					/>
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
				{tabValue === "downloaded" ? (
					<DownloadedList />
				) : (
					<ActiveDownloadList />
				)}
			</motion.div>
		</div>
	);
}

export default function DownloadPage() {
	return (
		<Suspense>
			<DownloadPageContent />
		</Suspense>
	);
}
