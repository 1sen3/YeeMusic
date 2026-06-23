import { exit } from "@tauri-apps/plugin-process";
import { emit, listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import {
	ArrowExit20Regular,
	ChevronRight24Filled,
	Next24Regular,
	Pause24Regular,
	Play24Regular,
	Previous24Regular,
} from "@fluentui/react-icons";

export default function TrayMenu() {
	const [songInfo, setSongInfo] = useState({
		title: "Yee Music",
		artist: "未播放",
		coverUrl: "",
		isPlaying: false,
	});

	useEffect(() => {
		const unlisten = listen<{
			title: string;
			artist: string;
			coverUrl: string;
			isPlaying: boolean;
		}>("sync-player-state", (e) => {
			setSongInfo(e.payload);
		});

		return () => {
			unlisten.then((f) => f());
		};
	}, []);

	return (
		<div
			className="w-screen h-screen bg-white/0 dark:bg-black/60 backdrop-blur-2xl border flex flex-col p-2 select-none"
			style={{ fontFamily: '"Microsoft Yahei"' }}
		>
			<div className="px-2 py-2 flex items-center gap-3 mb-1 hover:bg-foreground/5 rounded-sm">
				{songInfo.coverUrl ? (
					<img
						src={songInfo.coverUrl}
						className="size-10 rounded-sm object-cover border"
					/>
				) : (
					<div className="size-10 rounded-md bg-black/5 dark:bg-white/10 shadow-sm" />
				)}
				<span className="flex flex-col flex-1 overflow-hidden">
					<span className="text-xs font-bold truncate text-foreground">
						{songInfo.title}
					</span>
					<span className="text-xs text-muted-foreground truncate">
						{songInfo.artist}
					</span>
				</span>
			</div>

			<TrayMenuSeparator />

			<TrayMenuItem onClick={() => emit("smtc-event", { event: "previous" })}>
				<Previous24Regular className="size-4" />
				上一首
			</TrayMenuItem>
			<TrayMenuItem onClick={() => emit("smtc-event", { event: "toggle" })}>
				{songInfo.isPlaying ? (
					<Pause24Regular className="size-4" />
				) : (
					<Play24Regular className="size-4" />
				)}
				{songInfo.isPlaying ? "暂停" : "播放"}
			</TrayMenuItem>
			<TrayMenuItem onClick={() => emit("smtc-event", { event: "next" })}>
				<Next24Regular className="size-4" />
				下一首
			</TrayMenuItem>

			<TrayMenuSeparator />

			<TrayMenuItem onClick={() => exit(0)}>
				<ArrowExit20Regular className="size-4" />
				退出
			</TrayMenuItem>
		</div>
	);
}

function TrayMenuSeparator() {
	return <div className="w-full h-px bg-border my-1 shrink-0" />;
}

function TrayMenuItem({
	children,
	onClick,
	hasChevron = false,
}: {
	children: React.ReactNode;
	onClick?: () => void;
	hasChevron?: boolean;
}) {
	return (
		<button
			className="hover:bg-black/5 dark:hover:bg-white/10 p-2 rounded-sm text-left transition-colors text-sm font-normal"
			onClick={onClick}
		>
			<div className="flex items-center gap-2 justify-between">
				<div className="flex items-center gap-2">{children}</div>
				{hasChevron && (
					<ChevronRight24Filled className="size-4 text-foreground/60" />
				)}
			</div>
		</button>
	);
}
