/**
 * @VerbatimWord
 *
 * 致谢:
 * 本文件中的动画曲线与动画参数参考自以下开源项目：
 *
 * - 项目名称: applemusic-like-lyrics
 * - 原作者: amll-dev
 * - 项目地址: https://github.com/amll-dev/applemusic-like-lyrics
 *
 * - 特此向原作者表示感谢。
 */

import { LyricWord } from "@/lib/utils/lyric-parser";
import {
	MotionValue,
	motion,
	useMotionTemplate,
	useSpring,
	useTransform,
} from "framer-motion";
import React, { useMemo } from "react";
import {
	VERBATIM_PROGRESS_SPRING,
	VERBATIM_TRANSLATE_SPRING,
} from "./lyric-animation";

export const VerbatimWord = React.memo(function VerbatimWord({
	word,
	currentTimeMotion,
}: {
	word: LyricWord;
	currentTimeMotion: MotionValue<number>;
}) {
	const emphasisFactor = React.useMemo(() => {
		const { duration, char } = word;
		const text = char.trim();

		if (text.length === 0 || text.length > 7) return 0;

		const threshold = 800;
		const range = 400;

		return Math.min(Math.max(duration - threshold, 0) / range, 1);
	}, [word]);

	const rawProgress = useTransform(
		currentTimeMotion,
		[word.startTime, word.startTime + word.duration],
		[0, 1],
	);

	const progress = useSpring(rawProgress, { ...VERBATIM_PROGRESS_SPRING });
	const gradientPct = useTransform(progress, (p) => `${(1 - p) * 100}%`);

	const TRANSLATE_DURATION = 600;
	const rawTranslateProgress = useTransform(
		currentTimeMotion,
		[word.startTime, word.startTime + TRANSLATE_DURATION],
		[0, 1],
	);
	const translateProgress = useSpring(rawTranslateProgress, {
		...VERBATIM_TRANSLATE_SPRING,
	});
	const translateY = useTransform(translateProgress, [0, 1], ["0px", "-3.2px"]);

	const brightness = useTransform(progress, [0, 0.5, 1], [0, 0.8, 1]);
	const halfBrightness = useTransform(brightness, (b) => b * 0.5);

	const backgroundImage = useMotionTemplate`linear-gradient(90deg,
      rgba(255,255,255,${brightness}) 0%,
      rgba(255,255,255,${brightness}) calc(100% - ${gradientPct}),
      rgba(255,255,255,${halfBrightness}) calc(100% - ${gradientPct} + 15%),
      rgba(255,255,255,0) calc(100% - ${gradientPct} + 35%)
    )`;

	const baseGlow = useTransform(progress, [0, 0.25, 0.7, 1], [0, 1, 0.4, 0]);

	const glowBlur = useTransform(baseGlow, [0, 1], [0, 10 * emphasisFactor]);
	const glowOpacity = useTransform(
		baseGlow,
		[0, 1],
		[0, 0.25 * emphasisFactor],
	);

	const coreBlur = useTransform(baseGlow, [0, 1], [0, 2 * emphasisFactor]);
	const coreOpacity = useTransform(baseGlow, [0, 1], [0, 0.6 * emphasisFactor]);

	const textShadow = useMotionTemplate`
      0 0 ${coreBlur}px rgba(255, 255, 255, ${coreOpacity}),
      0 0 ${glowBlur}px rgba(255, 255, 255, ${glowOpacity})
    `;

	const chars = useMemo(() => word.char.split(""), [word.char]);
	const isWavy = /\p{Script=Latin}/u.test(word.char) && emphasisFactor > 0;
	const needsPerChar = emphasisFactor > 0;

	if (!needsPerChar) {
		return (
			<motion.span
				style={{
					display: "inline-block",
					whiteSpace: "pre",
					fontWeight: "500",
					mixBlendMode: "plus-lighter",
					textShadow,
					y: translateY,
					willChange: "transform",
					backgroundImage,
					WebkitBackgroundClip: "text",
					backgroundClip: "text",
					WebkitTextFillColor: "rgba(255,255,255,0.4)",
					backgroundSize: "100%",
				}}
			>
				{word.char}
			</motion.span>
		);
	}

	const totalChars = chars.length;

	return (
		<motion.span
			style={{
				display: "inline-block",
				whiteSpace: "pre",
				fontWeight: "500",
				textShadow,
				mixBlendMode: "plus-lighter",
				y: translateY,
				willChange: "transform",
			}}
		>
			{chars.map((char, idx) => (
				<WavyChar
					key={idx}
					char={char}
					idx={idx}
					progress={progress}
					isWavy={isWavy}
					emphasisFactor={emphasisFactor}
					backgroundImage={backgroundImage}
					totalChars={totalChars}
				/>
			))}
		</motion.span>
	);
});

const WavyChar = React.memo(function WavyChar({
	char,
	idx,
	progress,
	isWavy,
	emphasisFactor,
	backgroundImage,
	totalChars,
}: {
	char: string;
	idx: number;
	progress: MotionValue<number>;
	isWavy: boolean;
	emphasisFactor: number;
	backgroundImage: MotionValue<string>;
	totalChars: number;
}) {
	const charY = useTransform(progress, (p) => {
		if (!isWavy || p <= 0 || p >= 1) return 0;
		const sine = Math.cos(p * Math.PI * 2 - idx * 0.5);
		return sine * 2 * emphasisFactor * Math.sin(p * Math.PI);
	});

	return (
		<motion.span
			style={{
				display: "inline-block",
				y: charY,
				backgroundImage,
				WebkitBackgroundClip: "text",
				backgroundClip: "text",
				WebkitTextFillColor: "rgba(255,255,255,0.4)",
				backgroundSize: `${totalChars * 100}% 100%`,
				backgroundPosition: `${(idx / Math.max(totalChars - 1, 1)) * 100}% 0%`,
				willChange: "transform",
			}}
		>
			{char}
		</motion.span>
	);
});
