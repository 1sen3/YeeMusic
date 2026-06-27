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

import {
	type MotionValue,
	motion,
	useMotionTemplate,
	useSpring,
	useTransform,
} from "framer-motion";
import React, { useMemo } from "react";
import type { LyricWord } from "@/lib/utils/lyric-parser";
import {
	VERBATIM_PROGRESS_SPRING,
	VERBATIM_TRANSLATE_SPRING,
} from "./lyric-animation";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const isCJK = (text: string) =>
	/^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u.test(text);

const easeIn = (value: number) => {
	const t = clamp01(value);
	return t * t * (3 - 2 * t);
};
const easeOut = (value: number) => {
	const t = clamp01(value);
	return 1 - (1 - t) * (1 - t) * (3 - 2 * (1 - t));
};
const emphasizeEase = (value: number) => {
	const t = clamp01(value);
	return t < 0.5 ? easeIn(t / 0.5) : 1 - easeOut((t - 0.5) / 0.5);
};

const getEmphasisMetrics = (duration: number) => {
	const safeDuration = Math.max(1000, duration);
	let amount = safeDuration / 2000;
	amount = amount > 1 ? Math.sqrt(amount) : amount ** 3;
	let blur = safeDuration / 3000;
	blur = blur > 1 ? Math.sqrt(blur) : blur ** 3;

	return {
		amount: Math.min(1.2, amount * 0.6),
		blur: Math.min(0.8, blur * 0.5),
	};
};

export const VerbatimWord = React.memo(function VerbatimWord({
	word,
	currentTimeMotion,
}: {
	word: LyricWord;
	currentTimeMotion: MotionValue<number>;
}) {
	const emphasisMetrics = React.useMemo(() => {
		const { duration, char } = word;
		const text = char.trim();

		const shouldEmphasize = isCJK(text)
			? duration >= 1000
			: duration >= 1000 && text.length <= 7 && text.length > 1;

		return shouldEmphasize
			? getEmphasisMetrics(duration)
			: { amount: 0, blur: 0 };
	}, [word]);

	const rawProgress = useTransform(
		currentTimeMotion,
		[word.startTime, word.startTime + word.duration],
		[0, 1],
	);

	const progress = useSpring(rawProgress, { ...VERBATIM_PROGRESS_SPRING });
	const brightStop = useTransform(progress, (p) => `${p * 100}%`);
	const fadeStop = useTransform(
		progress,
		(p) => `${Math.min(116, p * 100 + 22)}%`,
	);
	const brightAlpha = useTransform(progress, [0, 0.04, 1], [0.32, 1, 1]);
	const fadeAlpha = useTransform(progress, [0, 0.04, 1], [0.32, 0.5, 0.5]);

	const TRANSLATE_DURATION = 600;
	const rawTranslateProgress = useTransform(
		currentTimeMotion,
		[word.startTime, word.startTime + TRANSLATE_DURATION],
		[0, 1],
	);
	const translateProgress = useSpring(rawTranslateProgress, {
		...VERBATIM_TRANSLATE_SPRING,
	});
	const translateY = useTransform(
		translateProgress,
		[0, 1],
		["0em", "-0.05em"],
	);

	const wordMaskImage = useMotionTemplate`linear-gradient(90deg,
      rgba(0,0,0,${brightAlpha}) 0%,
      rgba(0,0,0,${brightAlpha}) ${brightStop},
      rgba(0,0,0,${fadeAlpha}) ${fadeStop},
      rgba(0,0,0,0.32) 100%
    )`;

	const chars = useMemo(() => {
		let signature = 0;
		return Array.from(word.char).map((char) => {
			signature += char.codePointAt(0) ?? 0;
			return {
				char,
				key: `${word.startTime}-${word.duration}-${signature}-${char}`,
			};
		});
	}, [word.char, word.duration, word.startTime]);
	const needsPerChar = emphasisMetrics.amount > 0;

	if (!needsPerChar) {
		return (
			<motion.span
				style={{
					display: "inline-block",
					whiteSpace: "pre",
					margin: "-0.25em",
					padding: "0.25em",
					fontWeight: "bolder",
					mixBlendMode: "plus-lighter",
					y: translateY,
					color: "rgba(255,255,255,0.95)",
					WebkitMaskImage: wordMaskImage,
					maskImage: wordMaskImage,
					WebkitMaskRepeat: "no-repeat",
					maskRepeat: "no-repeat",
					WebkitMaskSize: "100% 100%",
					maskSize: "100% 100%",
					willChange: "transform, text-shadow, mask-image",
				}}
			>
				{word.char}
			</motion.span>
		);
	}

	return (
		<motion.span
			style={{
				display: "inline-block",
				whiteSpace: "pre",
				margin: "-0.25em",
				padding: "0.25em",
				fontWeight: "bolder",
				mixBlendMode: "plus-lighter",
				y: translateY,
				color: "rgba(255,255,255,0.95)",
				WebkitMaskImage: wordMaskImage,
				maskImage: wordMaskImage,
				WebkitMaskRepeat: "no-repeat",
				maskRepeat: "no-repeat",
				WebkitMaskSize: "100% 100%",
				maskSize: "100% 100%",
				willChange: "transform, text-shadow, mask-image",
			}}
		>
			{chars.map(({ char, key }, idx) => (
				<WavyChar
					key={key}
					char={char}
					idx={idx}
					progress={progress}
					amount={emphasisMetrics.amount}
					blur={emphasisMetrics.blur}
					totalChars={chars.length}
				/>
			))}
		</motion.span>
	);
});

const WavyChar = React.memo(function WavyChar({
	char,
	idx,
	progress,
	amount,
	blur,
	totalChars,
}: {
	char: string;
	idx: number;
	progress: MotionValue<number>;
	amount: number;
	blur: number;
	totalChars: number;
}) {
	const getLocalPulse = (p: number) => {
		if (p <= 0 || p >= 1) return 0;
		const delay = totalChars <= 1 ? 0 : idx / (2.5 * Math.max(totalChars, 1));
		return emphasizeEase((p - delay) / (1 - delay));
	};

	const charY = useTransform(progress, (p) => {
		const pulse = getLocalPulse(p);
		const float = p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI) * 0.05;
		return `${-(pulse * 0.025 * amount + float)}em`;
	});

	const charX = useTransform(progress, (p) => {
		const pulse = getLocalPulse(p);
		const offset = -pulse * 0.03 * amount * (totalChars / 2 - idx);
		return `${offset}em`;
	});

	const charScale = useTransform(progress, (p) => {
		const pulse = getLocalPulse(p);
		return 1 + pulse * 0.1 * amount;
	});

	const glowBlur = useTransform(
		progress,
		(p) => `${Math.min(0.3, blur * 0.3) * getLocalPulse(p)}em`,
	);
	const glowOpacity = useTransform(progress, (p) => blur * getLocalPulse(p));
	const textShadow = useMotionTemplate`0 0 ${glowBlur} rgba(255, 255, 255, ${glowOpacity})`;

	return (
		<motion.span
			style={{
				display: "inline-block",
				x: charX,
				y: charY,
				scale: charScale,
				transformOrigin: "50% 78%",
				textShadow,
				willChange: "transform",
			}}
		>
			{char}
		</motion.span>
	);
});
