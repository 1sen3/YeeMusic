/**
 * @LyricLeadDots
 *
 * 致谢:
 * 该组件参考自以下开源项目：
 *
 * - 项目名称: applemusic-like-lyrics
 * - 原作者: amll-dev
 * - 项目地址: https://github.com/amll-dev/applemusic-like-lyrics
 *
 * - 特此向原作者表示感谢。
 */

import type { Transition } from "framer-motion";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { forwardRef, useEffect } from "react";
import { corePlayer } from "@/lib/player/corePlayer";
import type { ILyricLine } from "@/lib/utils/lyric-parser";
import {
	easeInOutBack,
	easeOutExpo,
	LAYOUT_TRANSITION,
} from "./lyric-animation";

const TOTAL = 3;
const FADE_IN_MS = 1000;
const FADE_OUT_MS = 750;
const TARGET_BREATHE_MS = 1500;

function dotOpacityAt(t: number, i: number, dotsDuration: number): number {
	const raw = ((t - (dotsDuration * i) / TOTAL) * TOTAL) / dotsDuration;
	return Math.max(0.25, Math.min(0.8, raw));
}

export const LyricLeadDots = forwardRef<
	HTMLDivElement,
	{
		isActive: boolean;
		targetScrollY: number;
		yTransition: Transition;
		lyricLine: ILyricLine;
	}
>(function LyricLeadDots(
	{ isActive, targetScrollY, yTransition, lyricLine },
	ref,
) {
	const duration = lyricLine.leadDotsDuration ?? 3000;

	const timeMV = useMotionValue(corePlayer.getCurrentTime() * 1000);
	useEffect(() => {
		const unsub = corePlayer.subscribeTime((t) => {
			timeMV.set(t * 1000);
		});
		return unsub;
	}, [timeMV]);

	const elapsed = useTransform(timeMV, (t) =>
		Math.max(0, t - lyricLine.lineStart),
	);

	const globalOpacity = useTransform(elapsed, (t) => {
		const remaining = duration - t;
		let opacity = 1;
		if (t < 500) opacity = 0;
		else if (t < FADE_IN_MS) opacity = (t - 500) / 500;
		if (remaining < FADE_OUT_MS) {
			opacity *= Math.max(0, remaining / FADE_OUT_MS);
		}
		return opacity;
	});

	const rawScale = useTransform(elapsed, (t) => {
		const remaining = duration - t;
		const numBreathes = Math.ceil(duration / TARGET_BREATHE_MS);
		const breatheDuration = duration / numBreathes;
		let s =
			Math.sin(1.5 * Math.PI - (t / breatheDuration) * Math.PI * 2) / 20 + 1;
		if (t < 2000) s *= easeOutExpo(t / 2000);
		if (remaining < FADE_OUT_MS) {
			s *= 1 - easeInOutBack((FADE_OUT_MS - remaining) / FADE_OUT_MS / 2);
		}
		return Math.max(0, s) * 0.7;
	});

	const dotsDuration = Math.max(0, duration - FADE_OUT_MS);

	const dot0 = useTransform(elapsed, (t) => dotOpacityAt(t, 0, dotsDuration));
	const dot1 = useTransform(elapsed, (t) => dotOpacityAt(t, 1, dotsDuration));
	const dot2 = useTransform(elapsed, (t) => dotOpacityAt(t, 2, dotsDuration));

	const dots = [
		{ key: "lead-dot-0", opacity: dot0 },
		{ key: "lead-dot-1", opacity: dot1 },
		{ key: "lead-dot-2", opacity: dot2 },
	];

	return (
		<motion.div
			layout="position"
			ref={ref}
			initial={false}
			animate={{ y: targetScrollY }}
			transition={{ y: yTransition, layout: LAYOUT_TRANSITION }}
		>
			{isActive && (
				<motion.div
					className="flex items-center justify-center gap-3 px-2 py-4 select-none pointer-events-none h-24"
					style={{ opacity: globalOpacity, scale: rawScale }}
				>
					{dots.map((dot) => (
						<motion.span
							key={dot.key}
							className="size-5 rounded-full bg-white mix-blend-plus-lighter backdrop-saturate-125 backdrop-brightness-125"
							style={{
								opacity: dot.opacity,
								willChange: "transform",
							}}
						/>
					))}
				</motion.div>
			)}
		</motion.div>
	);
});
LyricLeadDots.displayName = "LyricLeadDots";
