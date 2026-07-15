import { AnimatePresence, motion } from "framer-motion";
import type { MouseEvent } from "react";
import {
	Children,
	cloneElement,
	isValidElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { createPortal } from "react-dom";
import { useHotkeys } from "react-hotkeys-hook";
import { CLOSE_LYRIC_SHEET_EVENT } from "@/lib/events/lyric-sheet";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { extractBackgroundColors } from "@/lib/utils/color-extractor";
import { ParseLyric } from "@/lib/utils/lyric-parser";
import { Lyric } from "../lyric/lyric";
import {
	DEFAULT_LYRIC_SHEET_COLORS,
	LyricSheetBackground,
} from "./lyric-sheet-background";
import { LyricSheetBottomBar } from "./lyric-sheet-bottom-bar";
import { LyricSheetSonginfo } from "./lyric-sheet-songinfo";
import { LyricSheetSonglist } from "./lyric-sheet-songlist";
import { LyricSheetTitlebar } from "./lyric-sheet-titlebar";

const lyricSheetEase = [0.16, 1, 0.3, 1] as const;

// Keep the stage entrance to a brief opacity-only fade: while an ancestor of
// the blend surfaces animates opacity/filter/transform, plus-lighter is
// suspended (isolated group) and visibly switches on when the animation
// settles. A short fade ends while the blend elements are still fading
// themselves in, so the switch lands on moving, semi-transparent content
// where it can't be seen. (The old exit never ran — no AnimatePresence wraps
// the stage; closing is covered by LyricSheetExitBackdrop.)
const sheetStageMotion = {
	initial: {
		opacity: 0,
	},
	animate: {
		opacity: 1,
	},
	transition: {
		duration: 0.25,
		ease: "easeOut" as const,
	},
};

// Both side panels host plus-lighter blended text (lyrics / the songlist
// heading), so this config must not keep any isolation-creating style at
// rest — a persistent clip-path or non-none filter would form a stacking
// context and permanently cut the blending off from the mesh background.
const sidePanelMotion = {
	initial: {
		opacity: 0,
		x: 46,
		scale: 0.985,
		filter: "blur(12px)",
	},
	animate: {
		opacity: 1,
		x: 0,
		scale: 1,
		filter: "none",
		transitionEnd: {
			filter: "none",
		},
	},
	exit: {
		opacity: 0,
		x: 32,
		scale: 0.99,
		filter: "blur(10px)",
	},
	transition: {
		duration: 0.48,
		ease: lyricSheetEase,
	},
};

export function LyricSheet({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const currentSong = usePlayerStore((s) => s.currentSong);
	const currentCoverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;
	const [isMounted, setIsMounted] = useState(false);
	const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
	const [isLyricOpen, setIsLyricOpen] = useState(false);
	const togglePlay = usePlayerStore((s) => s.togglePlay);
	const currentSongLyrics = usePlayerStore((s) => s.currentSongLyrics);

	useEffect(() => {
		if (currentCoverUrl) void extractBackgroundColors(currentCoverUrl);
	}, [currentCoverUrl]);

	const [showTrans, setShowTrans] = useState(false);
	const [showRoma, setShowRoma] = useState(false);
	const [lastBackgroundColors, setLastBackgroundColors] = useState<
		[number, number, number][]
	>(DEFAULT_LYRIC_SHEET_COLORS);
	const hasTransLyric = useMemo(() => {
		const ytlrc = ParseLyric(currentSongLyrics?.ytlrc?.lyric);
		const tlyric = ParseLyric(currentSongLyrics?.tlyric?.lyric);
		return Boolean(ytlrc?.length || tlyric?.length);
	}, [currentSongLyrics]);
	const hasRomaLyric = useMemo(() => {
		const yromaLyric = ParseLyric(currentSongLyrics?.yromalrc?.lyric);
		const romaLyric = ParseLyric(currentSongLyrics?.romalrc?.lyric);
		return Boolean(yromaLyric?.length || romaLyric?.length);
	}, [currentSongLyrics]);
	const trigger = Children.toArray(children).find(isValidElement);
	const triggerElement = isValidElement<{
		onClick?: (event: MouseEvent) => void;
	}>(trigger)
		? cloneElement(trigger, {
				onClick: (event: MouseEvent) => {
					trigger.props.onClick?.(event);
					if (!event.defaultPrevented) setIsOpen(true);
				},
			})
		: null;
	const handleBackgroundColorsChange = useCallback(
		(colors: [number, number, number][]) => {
			setLastBackgroundColors(colors);
		},
		[],
	);

	useEffect(() => {
		if (!hasTransLyric && showTrans) setShowTrans(false);
		if (!hasRomaLyric && showRoma) setShowRoma(false);
	}, [hasRomaLyric, hasTransLyric, showRoma, showTrans]);

	useEffect(() => {
		if (isOpen) setIsMounted(true);
	}, [isOpen]);

	useEffect(() => {
		function handleCloseLyricSheet() {
			setIsOpen(false);
			setIsPlaylistOpen(false);
			setIsLyricOpen(false);
		}

		window.addEventListener(CLOSE_LYRIC_SHEET_EVENT, handleCloseLyricSheet);
		return () => {
			window.removeEventListener(
				CLOSE_LYRIC_SHEET_EVENT,
				handleCloseLyricSheet,
			);
		};
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsOpen(false);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen]);

	useHotkeys(
		"space",
		(e) => {
			e.preventDefault();
			togglePlay();
		},
		{ enableOnFormTags: false, enabled: isOpen },
		[isOpen, togglePlay],
	);

	return (
		<>
			{triggerElement}
			{isMounted &&
				createPortal(
					<div
						className={`fixed inset-0 z-50 h-screen w-screen overflow-hidden text-sm ${
							isOpen ? "pointer-events-auto" : "pointer-events-none"
						}`}
						onContextMenu={(e) => e.preventDefault()}
					>
						<h2 className="sr-only">Lyrics</h2>
						{isOpen ? (
							<>
								<LyricSheetBackground
									onColorsChange={handleBackgroundColorsChange}
								/>
								<motion.div
									{...sheetStageMotion}
									className="relative flex h-full w-full flex-col"
									onMouseDown={(e) => {
										e.preventDefault();
									}}
								>
									<LyricSheetTitlebar setIsOpen={setIsOpen} />

									<div className="relative flex min-h-0 w-full flex-1 justify-between">
										<motion.div
											layout
											initial={false}
											animate={{
												x: "0%",
												width: isPlaylistOpen || isLyricOpen ? "50%" : "100%",
											}}
											transition={{
												type: "spring",
												stiffness: 300,
												damping: 30,
											}}
											className="relative flex h-full shrink-0 flex-col items-center justify-center pt-16 text-white"
										>
											<LyricSheetSonginfo setIsOpen={setIsOpen} />
										</motion.div>
										<AnimatePresence>
											{isPlaylistOpen && (
												<motion.div
													{...sidePanelMotion}
													className="absolute top-24 right-24 bottom-12 w-[calc(50%-48px)]"
												>
													<LyricSheetSonglist
														className="flex h-full w-full"
														setOpen={setIsOpen}
													/>
												</motion.div>
											)}
										</AnimatePresence>
										<AnimatePresence>
											{isLyricOpen && (
												<div className="absolute top-18 right-12 bottom-0 w-[calc(50%-48px)]">
													<Lyric
														className="flex h-full w-full"
														showTrans={showTrans}
														showRoma={showRoma}
													/>
												</div>
											)}
										</AnimatePresence>
									</div>

									<LyricSheetBottomBar
										isLyricOpen={isLyricOpen}
										isPlaylistOpen={isPlaylistOpen}
										hasTransLyric={hasTransLyric}
										hasRomaLyric={hasRomaLyric}
										showTrans={showTrans}
										showRoma={showRoma}
										onLyricOpenChangeAction={setIsLyricOpen}
										onPlaylistOpenChangeAction={setIsPlaylistOpen}
										onShowTransChangeAction={setShowTrans}
										onShowRomaChangeAction={setShowRoma}
									/>
								</motion.div>
							</>
						) : (
							<LyricSheetExitBackdrop
								colors={lastBackgroundColors}
								onExitComplete={() => setIsMounted(false)}
							/>
						)}
					</div>,
					document.body,
				)}
		</>
	);
}

function LyricSheetExitBackdrop({
	colors,
	onExitComplete,
}: {
	colors: [number, number, number][];
	onExitComplete: () => void;
}) {
	const [primary, secondary, tertiary, quaternary, base] =
		colors.length >= 5 ? colors : DEFAULT_LYRIC_SHEET_COLORS;
	const background = [
		`radial-gradient(circle at 22% 20%, ${toCssRgb(primary)} 0%, transparent 34%)`,
		`radial-gradient(circle at 80% 18%, ${toCssRgb(secondary)} 0%, transparent 30%)`,
		`radial-gradient(circle at 58% 78%, ${toCssRgb(tertiary)} 0%, transparent 38%)`,
		`linear-gradient(135deg, ${toCssRgb(quaternary)} 0%, ${toCssRgb(base)} 100%)`,
	].join(", ");

	return (
		<motion.div
			className="absolute inset-0"
			initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
			animate={{ opacity: 0, scale: 1.018, filter: "blur(18px)" }}
			transition={{ duration: 0.42, ease: lyricSheetEase }}
			style={{
				background,
				willChange: "transform, opacity, filter",
			}}
			onAnimationComplete={onExitComplete}
		/>
	);
}

function toCssRgb([r, g, b]: [number, number, number]) {
	return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(
		b * 255,
	)})`;
}
