export const lyricSheetEase = [0.16, 1, 0.3, 1] as const;

// Shared enter/exit motion for the two side panels (songlist / lyrics).
//
// Both panels host plus-lighter blended text, so this config must never leave
// an isolation-creating style at rest — a persistent clip-path or non-none
// filter would form a stacking context and permanently cut the blending off
// from the mesh background (fixed once in 4adf43c; keep the
// `transitionEnd: { filter: "none" }`).
//
// The exit is deliberately faster and quieter than the entrance: the panels are
// mutually exclusive, so on a lyric↔playlist swap the outgoing panel must be
// mostly gone before the incoming one is halfway in, instead of two walls of
// text double-exposing for half a second.
export function getSidePanelMotion(reduceMotion: boolean) {
	if (reduceMotion) {
		return {
			initial: { opacity: 0 },
			animate: { opacity: 1 },
			exit: { opacity: 0, transition: { duration: 0.2 } },
			transition: { duration: 0.25 },
		};
	}
	return {
		initial: { opacity: 0, x: 46, scale: 0.985, filter: "blur(12px)" },
		animate: {
			opacity: 1,
			x: 0,
			scale: 1,
			filter: "none",
			transitionEnd: { filter: "none" },
		},
		exit: {
			opacity: 0,
			x: 16,
			filter: "blur(8px)",
			transition: { duration: 0.26, ease: lyricSheetEase },
		},
		transition: { duration: 0.48, ease: lyricSheetEase },
	};
}
