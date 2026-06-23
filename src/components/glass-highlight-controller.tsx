import { useEffect } from "react";

const GLASS_SELECTOR = ".yee-glass-surface, .yee-glass-tab-trigger";

export function GlassHighlightController() {
	useEffect(() => {
		let frameId = 0;
		let lastEvent: PointerEvent | null = null;
		let activeElement: HTMLElement | null = null;

		function updateActiveElement(nextElement: HTMLElement | null) {
			if (activeElement === nextElement) return;

			if (activeElement) {
				activeElement.removeEventListener("pointermove", handlePointerMove);
				activeElement.removeEventListener("pointerleave", handlePointerLeave);
				activeElement.style.removeProperty("--yee-glass-highlight-angle");
			}

			activeElement = nextElement;

			if (activeElement) {
				activeElement.addEventListener("pointermove", handlePointerMove, {
					passive: true,
				});
				activeElement.addEventListener("pointerleave", handlePointerLeave);
			}
		}

		function updateHighlight() {
			frameId = 0;
			if (!lastEvent || !activeElement) return;

			const rect = activeElement.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const angle =
				(Math.atan2(lastEvent.clientY - centerY, lastEvent.clientX - centerX) *
					180) /
					Math.PI +
				135;

			activeElement.style.setProperty(
				"--yee-glass-highlight-angle",
				`${angle}deg`,
			);
		}

		function handlePointerMove(event: PointerEvent) {
			lastEvent = event;
			if (!frameId) {
				frameId = window.requestAnimationFrame(updateHighlight);
			}
		}

		function handlePointerLeave() {
			lastEvent = null;
			if (frameId) {
				window.cancelAnimationFrame(frameId);
				frameId = 0;
			}
			updateActiveElement(null);
		}

		function handlePointerOver(event: PointerEvent) {
			const target = event.target;
			const element =
				target instanceof Element
					? target.closest<HTMLElement>(GLASS_SELECTOR)
					: null;

			updateActiveElement(element);
		}

		document.addEventListener("pointerover", handlePointerOver, {
			passive: true,
		});

		return () => {
			document.removeEventListener("pointerover", handlePointerOver);
			if (frameId) window.cancelAnimationFrame(frameId);
			updateActiveElement(null);
		};
	}, []);

	return null;
}
