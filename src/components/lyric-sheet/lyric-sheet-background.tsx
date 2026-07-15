import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import {
	extractBackgroundColors,
	getCachedBackgroundColors,
} from "@/lib/utils/color-extractor";
import { MeshGradient } from "../mesh-gradient/mesh-gradient-background";

interface LyricSheetBackgroundProps {
	onColorsChange?: (colors: [number, number, number][]) => void;
}

const BACKGROUND_PIPELINE_VERSION = 5;

interface BackgroundFrame {
	key: string;
	order: number;
	colors: [number, number, number][];
	textureData: ImageData | null;
}

export const DEFAULT_LYRIC_SHEET_COLORS: [number, number, number][] = [
	[0.1, 0.1, 0.18],
	[0.09, 0.07, 0.24],
	[0.06, 0.2, 0.38],
	[0.12, 0.08, 0.3],
	[0.1, 0.1, 0.18],
];

export function LyricSheetBackground({
	onColorsChange,
}: LyricSheetBackgroundProps) {
	const currentSong = usePlayerStore((s) => s.currentSong);
	const coverUrl = currentSong?.al?.picUrl || currentSong?.album?.picUrl;

	const [background, setBackground] = useState<BackgroundFrame | null>(() => {
		if (!coverUrl) return null;
		const cached = getCachedBackgroundColors(coverUrl);
		if (!cached) return null;
		return {
			key: `${coverUrl}-${BACKGROUND_PIPELINE_VERSION}`,
			order: 1,
			colors: cached.mesh as [number, number, number][],
			textureData: cached.texture,
		};
	});

	useEffect(() => {
		let active = true;

		async function getColors() {
			if (!coverUrl) {
				setBackground(null);
				return;
			}
			const nextColors = await extractBackgroundColors(coverUrl);
			if (!active) return;
			setBackground((previous) => ({
				key: `${coverUrl}-${BACKGROUND_PIPELINE_VERSION}`,
				order: (previous?.order ?? 0) + 1,
				colors: nextColors.mesh as [number, number, number][],
				textureData: nextColors.texture,
			}));
			onColorsChange?.(nextColors.palette as [number, number, number][]);
		}

		getColors();

		return () => {
			active = false;
		};
	}, [coverUrl, onColorsChange]);

	return (
		<motion.div
			className="absolute inset-0 z-0 overflow-hidden"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
			style={{
				backgroundColor: getBackgroundBase(
					background?.colors ?? DEFAULT_LYRIC_SHEET_COLORS,
				),
			}}
		>
			<div className="relative h-full w-full overflow-hidden">
				{coverUrl && (
					<div
						className="absolute -inset-[8%]"
						style={{
							backgroundImage: `url("${coverUrl.replace(/"/g, "%22")}")`,
							backgroundPosition: "center",
							backgroundSize: "cover",
							// Mirrors applyBgRenderGrade so the pre-fade cover layer
							// matches the mesh texture that fades in above it.
							filter:
								"blur(52px) contrast(40%) saturate(300%) contrast(170%) brightness(75%)",
							transform: "scale(1.12)",
						}}
					/>
				)}
				<div
					className="absolute inset-0"
					style={{
						backgroundColor: "rgb(10 12 16 / 12%)",
						zIndex: 1,
					}}
				/>
				<AnimatePresence initial={false}>
					{background && (
						<motion.div
							key={background.key}
							className="absolute inset-0"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 1 }}
							transition={{ duration: 0.65, ease: "easeOut" }}
							style={{ zIndex: background.order + 2 }}
						>
							<MeshGradient
								colors={background.colors}
								textureData={background.textureData}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}

function getBackgroundBase(colors: [number, number, number][]) {
	const average = colors.reduce(
		(result, color) => {
			result[0] += color[0];
			result[1] += color[1];
			result[2] += color[2];
			return result;
		},
		[0, 0, 0],
	);
	const divisor = Math.max(1, colors.length);
	return `rgb(${Math.round((average[0] / divisor) * 200)} ${Math.round((average[1] / divisor) * 200)} ${Math.round((average[2] / divisor) * 200)})`;
}
