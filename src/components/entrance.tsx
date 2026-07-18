import { motion, useReducedMotion } from "framer-motion";

export const entranceEase = [0.16, 1, 0.3, 1] as const;

/**
 * 分段入场：fade + 轻微上移 + blur 消散，与歌词页共用同一套缓动语言。
 * 减弱动态（prefers-reduced-motion）时退化为纯淡入。
 */
export function Entrance({
	delay = 0,
	className,
	children,
}: {
	delay?: number;
	className?: string;
	children: React.ReactNode;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			className={className}
			initial={
				reduceMotion
					? { opacity: 0 }
					: { opacity: 0, y: 16, filter: "blur(8px)" }
			}
			animate={
				reduceMotion
					? { opacity: 1, transition: { duration: 0.25, delay } }
					: {
							opacity: 1,
							y: 0,
							filter: "blur(0px)",
							transition: { duration: 0.55, ease: entranceEase, delay },
							// blur(0px) 也会创建 stacking context，落定后清掉
							transitionEnd: { filter: "none" },
						}
			}
		>
			{children}
		</motion.div>
	);
}
