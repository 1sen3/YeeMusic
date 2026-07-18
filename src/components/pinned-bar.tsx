import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type RefObject, useEffect, useState } from "react";
import { BlurLayer } from "@/components/blur-layer";
import { entranceEase } from "@/components/entrance";
import { cn } from "@/lib/utils";

/**
 * 监听头部区块是否滚出主滚动容器视口。
 * 头部在数据加载后才挂载时，用 enabled 控制观察时机。
 */
export function usePinned(
	headerRef: RefObject<HTMLElement | null>,
	enabled = true,
) {
	const [isPinned, setIsPinned] = useState(false);

	useEffect(() => {
		if (!enabled) return;

		const root = document.getElementById("main-scroll-container");
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsPinned(!entry.isIntersecting);
			},
			{
				root,
				rootMargin: "-10px 0px 0px 0px",
				threshold: 0,
			},
		);

		if (headerRef.current) {
			observer.observe(headerRef.current);
		}

		return () => observer.disconnect();
	}, [headerRef, enabled]);

	return isPinned;
}

/**
 * 详情页置顶操作栏：sticky 容器 + 渐进模糊背景 + 居中收缩标题。
 * 头部大标题滚出视口（isPinned）后，收缩标题淡入、BlurLayer 渐显，
 * 回答「我在哪」；两者都尊重 prefers-reduced-motion。
 * children 为操作栏内容（左右分组自带 pl-8 / pr-8）。
 */
export function PinnedBar({
	isPinned,
	title,
	className,
	children,
}: {
	isPinned: boolean;
	title?: React.ReactNode;
	className?: string;
	children: React.ReactNode;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<div className={cn("sticky top-0 z-10 shrink-0 pt-6 pb-10", className)}>
			<div className="relative z-10 flex items-center justify-between">
				{children}

				{title && (
					<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
						<AnimatePresence>
							{isPinned && (
								<motion.span
									className="max-w-[36%] truncate font-semibold text-foreground/90 text-sm"
									initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
									animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
									exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
									transition={{ duration: 0.25, ease: entranceEase }}
								>
									{title}
								</motion.span>
							)}
						</AnimatePresence>
					</div>
				)}
			</div>

			<AnimatePresence>
				{isPinned && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
					>
						<BlurLayer />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
