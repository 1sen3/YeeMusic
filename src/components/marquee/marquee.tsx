import { cn } from "@/lib/utils";
import styles from "./marquee.module.css";
import { useEffect, useRef, useState } from "react";

const SPEED = 50;

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
	const textRef = useRef<HTMLDivElement>(null);
	const [shouldAnimate, setShouldAnimate] = useState(false);
	const [duration, setDuration] = useState(30);

	useEffect(() => {
		const checkOverflow = () => {
			if (containerRef.current && textRef.current) {
				const containerWidth = containerRef.current.clientWidth;
				const textWidth = textRef.current.scrollWidth;

				const isOverflowing = textWidth > containerWidth;
				setShouldAnimate(isOverflowing);

				if (isOverflowing) {
					setDuration(textWidth / SPEED);
				}
			}
		};

		checkOverflow();
	}, [text]);

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
			style={{
				WebkitMaskImage: shouldAnimate
					? "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)"
					: "none",
			}}
		>
			<div
				className={cn(shouldAnimate && styles.marqueeContainer)}
				style={{
					animationDuration: `${duration}s`,
					display: "flex",
					width: "max-content",
				}}
			>
				<div className="flex">{content}</div>
				{shouldAnimate && <div className="flex">{content}</div>}
			</div>
		</div>
	);
}
