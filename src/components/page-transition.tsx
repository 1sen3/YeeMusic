import { motion } from "framer-motion";
import type React from "react";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
	children: React.ReactNode;
}

/**
 * 页面切换过渡：仅入场动画（fade + 轻微上移），不做出场，
 * 避免 AnimatePresence mode="wait" 带来的导航延迟感。
 * 通过 location key 触发重挂载，并在切换时重置内容区滚动位置。
 */
export function PageTransition({ children }: PageTransitionProps) {
	const location = useLocation();
	// 页面身份 = 路径 + 资源标识参数（id/uid/q）。
	// tab 这类展示性参数变化不应重放整页入场动画。
	const params = new URLSearchParams(location.search);
	const identity = ["id", "uid", "q"]
		.map((key) => params.get(key) ?? "")
		.join("&");
	const pageKey = `${location.pathname}|${identity}`;

	useLayoutEffect(() => {
		document
			.getElementById("main-scroll-container")
			?.scrollTo({ top: 0, behavior: "instant" });
	}, [pageKey]);

	return (
		<motion.div
			key={pageKey}
			className="w-full min-h-full flex flex-col"
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
		>
			{children}
		</motion.div>
	);
}
