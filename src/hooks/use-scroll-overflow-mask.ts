import React, { useCallback, useMemo, useState } from "react";

export function useScrollOverflowMask() {
	const [scrollState, setScrollState] = useState<"top" | "middle" | "bottom">(
		"top",
	);

	const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
		const target = event.currentTarget;
		const scrollOffset = target.scrollTop;
		const maxScroll = target.scrollHeight - target.clientHeight;

		// 如果内容总高度不足以滚动（不需要 mask）
		if (maxScroll <= 0) {
			setScrollState("top");
			return;
		}

		if (scrollOffset <= 0) {
			setScrollState("top");
		} else if (scrollOffset >= maxScroll - 1) {
			setScrollState("bottom");
		} else {
			setScrollState("middle");
		}
	}, []);

	const maskImage = useMemo(() => {
		switch (scrollState) {
			case "top":
				return "linear-gradient(to bottom, black 0%, black 90%, transparent 100%)";
			case "bottom":
				return "linear-gradient(to bottom, transparent 0%, black 10%, black 100%)";
			case "middle":
			default:
				return "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)";
		}
	}, [scrollState]);

	return { handleScroll, maskImage };
}
