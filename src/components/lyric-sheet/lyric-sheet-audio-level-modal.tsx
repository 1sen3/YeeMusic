import { QUALITY_BY_KEY } from "@/lib/constants/song";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { cn, formatFileSize } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MusicLevelPopover } from "../music-level-popover";
import {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";

export function LyricSheetAudioLevelModel({
	setIsLyricSheetOpen,
}: {
	setIsLyricSheetOpen: (isOpen: boolean) => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const { currentMusicLevelKey } = usePlayerStore();
	const currentSongMusicDetail = usePlayerStore(
		(s) => s.currentSongMusicDetail,
	);
	const navigate = useNavigate();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<div className="rounded-sm border-0 px-2 py-1 font-semibold text-xs text-white/40 transition-colors duration-300 ease-out select-none mix-blend-plus-lighter backdrop-blur-md hover:bg-background/20">
					{QUALITY_BY_KEY[currentMusicLevelKey].desc}
				</div>
			</DialogTrigger>
			<DialogContent className="border-0 bg-card/60 backdrop-blur-md yee-drop-shadow">
				<DialogTitle className="sr-only">音频质量</DialogTitle>
				<DialogBody>
					<div className="flex flex-col justify-start gap-4 px-4 pt-8">
						<MusicLevelPopover
							side="bottom"
							sideOffset={16}
							variant="dark"
							open={isOpen}
							onOpenChange={setIsOpen}
						>
							<div className="-mx-4 -mt-4 flex items-center justify-between rounded-md p-4 hover:bg-foreground/10">
								<span className="font-semibold text-lg">
									{QUALITY_BY_KEY[currentMusicLevelKey].desc}
								</span>
								<ChevronDown
									className={cn(
										isOpen && "rotate-180",
										"transition-transform duration-300 ease-in-out",
									)}
								/>
							</div>
						</MusicLevelPopover>
						<p className="text-foreground/60 text-sm">
							{currentMusicLevelKey === "local" ||
							currentMusicLevelKey === "unlock" ? (
								<span>不支持修改音质</span>
							) : (
								formatFileSize(
									currentSongMusicDetail.find(
										(d) => d.key === currentMusicLevelKey,
									)?.size ?? 0,
								)
							)}
						</p>
					</div>
				</DialogBody>
				<DialogFooter>
					<DialogAction
						className="bg-card text-foreground hover:bg-card/80"
						onClick={() => {
							navigate("/setting");
							setIsLyricSheetOpen(false);
						}}
					>
						详细设置
					</DialogAction>
					<DialogCancel className="border-none bg-primary text-white hover:bg-primary/80">
						好
					</DialogCancel>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
