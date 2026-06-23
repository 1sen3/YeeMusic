import { QUALITY_BY_KEY, QualityKey } from "@/lib/constants/song";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { SongQualityDetail } from "@/lib/types/song";
import { cn, formatFileSize } from "@/lib/utils";
import { Children, ReactNode, isValidElement } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export function MusicLevelPopover({
	open,
	onOpenChange,
	side = "top",
	sideOffset = 48,
	contentClassName,
	className,
	children,
}: {
	open?: boolean;
	onOpenChange?: (value: boolean) => void;
	variant?: "light" | "dark";
	side?: "top" | "right" | "bottom" | "left";
	sideOffset?: number;
	contentClassName?: string;
	className?: string;
	children?: ReactNode;
}) {
	const {
		currentMusicLevelKey,
		currentSongMusicDetail,
		setCurrentMusicLevelKey,
	} = usePlayerStore();

	const isUnlock = currentMusicLevelKey === "unlock";
	const trigger = Children.toArray(children).find(isValidElement);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger asChild={!!trigger}>
				{trigger ? (
					trigger
				) : (
					<span
						className={cn(
							"rounded-md border bg-card/50 px-2 py-1 font-bold text-foreground/60 text-xs hover:bg-card/30",
							className,
						)}
					>
						{QUALITY_BY_KEY[currentMusicLevelKey].desc}
					</span>
				)}
			</PopoverTrigger>
			<PopoverContent
				side={side}
				sideOffset={sideOffset}
				className={cn(
					"w-64 rounded-lg bg-card/80 backdrop-blur-md",
					contentClassName,
				)}
			>
				{isUnlock || currentMusicLevelKey === "local" ? (
					<div className="text-center">
						{isUnlock ? "灰色音源歌曲不支持修改音质" : "本地音乐"}
					</div>
				) : (
					<ul className="flex flex-col gap-2">
						{currentSongMusicDetail?.map((quality: SongQualityDetail) => (
							<AudioLevelItem
								key={quality.key}
								qualityKey={quality.key as QualityKey}
								size={formatFileSize(quality.size)}
								selected={quality.key === currentMusicLevelKey}
								onClick={setCurrentMusicLevelKey}
							/>
						))}
					</ul>
				)}
			</PopoverContent>
		</Popover>
	);
}

interface AudioLevelItemProps {
	qualityKey: QualityKey;
	size?: string;
	selected?: boolean;
	onClick: (level: QualityKey) => void;
}

export function AudioLevelItem({
	qualityKey,
	size,
	selected = false,
	onClick,
}: AudioLevelItemProps) {
	const option = QUALITY_BY_KEY[qualityKey];

	return (
		<div
			className={cn(
				"relative flex items-center justify-between rounded-md px-4 py-2 hover:bg-foreground/8",
				selected && "bg-foreground/5",
			)}
			onClick={() => onClick(qualityKey)}
		>
			<span className="font-semibold">{option.desc}</span>

			<div className="flex items-center gap-2">
				{size && (
					<span className={cn("text-foreground/60 text-xs")}>{size}</span>
				)}
				{selected && (
					<span className="absolute top-1/2 left-0 h-4 w-1 -translate-1/2 rounded-full bg-primary" />
				)}
			</div>
		</div>
	);
}
