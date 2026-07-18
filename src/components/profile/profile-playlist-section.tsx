import { CaretLeft24Filled, CaretRight24Filled } from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { PlaylistCoverCard } from "@/components/playlist/playlist-cover-card";
import { YeeButton } from "@/components/yee-button";
import type { Playlist } from "@/lib/types";

const SECTION_GAP_PX = 32; // 与容器上的 --section-gap: 2rem 保持一致

export function ProfilePlaylistSection({
	title,
	playlists,
}: {
	title: string;
	playlists: Playlist[];
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [itemsPerPage, setItemsPerPage] = useState(8);
	const [hasOverflow, setHasOverflow] = useState(false);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const updateScrollState = () => {
			const width = container.clientWidth;
			setItemsPerPage(width >= 1760 ? 9 : width >= 1440 ? 8 : 7);

			const maxScrollLeft = container.scrollWidth - container.clientWidth;
			const epsilon = 1;
			setHasOverflow(maxScrollLeft > epsilon);
			setCanScrollPrev(container.scrollLeft > epsilon);
			setCanScrollNext(container.scrollLeft < maxScrollLeft - epsilon);
		};

		updateScrollState();
		const observer = new ResizeObserver(updateScrollState);
		observer.observe(container);
		container.addEventListener("scroll", updateScrollState, { passive: true });
		return () => {
			observer.disconnect();
			container.removeEventListener("scroll", updateScrollState);
		};
	}, []);

	const scrollByPage = (direction: 1 | -1) => {
		const container = containerRef.current;
		if (!container) return;
		// 每个条目的 flexBasis 按 itemsPerPage 均分容器宽度，
		// 因此翻一页正好是「容器宽度 + 一个间距」。
		const pageStride = container.clientWidth + SECTION_GAP_PX;
		const currentPage = Math.round(container.scrollLeft / pageStride);
		container.scrollTo({
			left: (currentPage + direction) * pageStride,
			behavior: "smooth",
		});
	};

	if (playlists.length === 0) return null;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="font-medium text-foreground/88 text-sm">{title}</h2>
				{hasOverflow && (
					<div className="flex items-center gap-2">
						<YeeButton
							variant="ghost"
							icon={<CaretLeft24Filled className="size-3" />}
							className="size-6 rounded-full bg-card border! border-border! text-muted-foreground hover:text-muted-foreground"
							onClick={() => scrollByPage(-1)}
							disabled={!canScrollPrev}
						/>
						<YeeButton
							variant="ghost"
							icon={<CaretRight24Filled className="size-3" />}
							className="size-6 rounded-full bg-card border! border-border! text-muted-foreground hover:text-muted-foreground"
							onClick={() => scrollByPage(1)}
							disabled={!canScrollNext}
						/>
					</div>
				)}
			</div>
			<div
				ref={containerRef}
				className="flex w-full gap-(--section-gap) overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
				style={
					{
						"--section-gap": "2rem",
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					} as React.CSSProperties
				}
			>
				{playlists.map((playlist) => (
					<div
						key={playlist.id}
						className="shrink-0"
						style={{
							flexBasis: `calc((100% - var(--section-gap) * ${itemsPerPage - 1}) / ${itemsPerPage})`,
						}}
					>
						<PlaylistCoverCard playlist={playlist} />
					</div>
				))}
			</div>
		</div>
	);
}
