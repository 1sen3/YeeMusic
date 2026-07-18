import { cn } from "@/lib/utils";
import styles from "./marquee.module.css";
import { useCallback, useEffect, useRef, useState } from "react";

const SPEED = 50; // 巡航滚动速度 px/s
const HOLD_MS = 3000; // 每组滚动结束后在起点停留的时间
// 一组连续滚 3 轮（轮数硬编码在 marquee.module.css 的关键帧里）。
// 总时长 = 3 轮巡航 + 首尾缓入缓出的额外开销，系数与 CSS 中的推导对应
const GROUP_DURATION_FACTOR = 3.192;
const FADE_WIDTH = "24px";

export function Marquee({
	text,
	textClassName,
	containerClassName,
}: {
	text: string;
	textClassName?: string;
	containerClassName?: string;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const holdTimerRef = useRef<number>(undefined);
	const [shouldAnimate, setShouldAnimate] = useState(false);
	const [scrolling, setScrolling] = useState(false);
	const [duration, setDuration] = useState(30);

	useEffect(() => {
		const container = containerRef.current;
		const textEl = textRef.current;
		if (!container || !textEl) return;

		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const checkOverflow = () => {
			const isOverflowing = textEl.scrollWidth > container.clientWidth;
			setShouldAnimate(isOverflowing && !reducedMotion);
			if (isOverflowing) {
				setDuration((textEl.scrollWidth / SPEED) * GROUP_DURATION_FACTOR);
			}
		};

		checkOverflow();
		const observer = new ResizeObserver(checkOverflow);
		observer.observe(container);
		return () => observer.disconnect();
	}, [text]);

	const scheduleScroll = useCallback(() => {
		window.clearTimeout(holdTimerRef.current);
		holdTimerRef.current = window.setTimeout(
			() => setScrolling(true),
			HOLD_MS,
		);
	}, []);

	// 起点停留 → 滚动一轮 → 回到起点停留的循环
	useEffect(() => {
		setScrolling(false);
		if (!shouldAnimate) {
			window.clearTimeout(holdTimerRef.current);
			return;
		}
		scheduleScroll();
		return () => window.clearTimeout(holdTimerRef.current);
	}, [shouldAnimate, text, scheduleScroll]);

	const handleAnimationEnd = () => {
		// 滚满一组（ROUNDS 轮）后才触发；-50% 与 0 像素级重合，归位不会跳动
		setScrolling(false);
		scheduleScroll();
	};

	const content = (
		<span
			ref={textRef}
			className={cn(
				"whitespace-nowrap",
				shouldAnimate && "pr-8",
				textClassName,
			)}
		>
			{text}
		</span>
	);

	return (
		<div
			ref={containerRef}
			className={cn(
				"relative overflow-hidden",
				containerClassName,
				styles.marqueeWrapper,
			)}
			style={
				{
					// 右侧遮罩只要溢出就显示；左侧遮罩仅在滚动时淡入，
					// 停在起点时隐藏，避免盖住行首文字
					"--marquee-fade-right": shouldAnimate ? FADE_WIDTH : "0px",
					"--marquee-fade-left": scrolling ? FADE_WIDTH : "0px",
				} as React.CSSProperties
			}
		>
			<div
				className={cn("flex w-max", scrolling && styles.marqueeScrolling)}
				style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
				onAnimationEnd={handleAnimationEnd}
			>
				<div className="flex">{content}</div>
				{shouldAnimate && <div className="flex">{content}</div>}
			</div>
		</div>
	);
}
