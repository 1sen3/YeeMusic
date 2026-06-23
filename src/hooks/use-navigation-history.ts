import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

export function useNavigationHistory() {
	const location = useLocation();
	const searchParams = useSearchParams();

	const [state, setState] = useState({
		history: [] as string[],
		currentIndex: -1,
	});

	useEffect(() => {
		const search = searchParams.toString();
		const url = location.pathname + (search ? `?${search}` : "");

		setState((prev) => {
			const { history, currentIndex } = prev;

			// Initialize
			if (history.length === 0) {
				return { history: [url], currentIndex: 0 };
			}

			// No change
			if (history[currentIndex] === url) {
				return prev;
			}

			// Went back
			if (currentIndex > 0 && history[currentIndex - 1] === url) {
				return { ...prev, currentIndex: currentIndex - 1 };
			}

			// Went forward
			if (
				currentIndex < history.length - 1 &&
				history[currentIndex + 1] === url
			) {
				return { ...prev, currentIndex: currentIndex + 1 };
			}

			// New push navigation
			const newHistory = history.slice(0, currentIndex + 1);
			newHistory.push(url);
			return { history: newHistory, currentIndex: newHistory.length - 1 };
		});
	}, [location.pathname, searchParams]);

	const canGoBack = state.currentIndex > 0;
	const canGoForward = state.currentIndex < state.history.length - 1;

	return { canGoBack, canGoForward };
}
