import {
	CaretLeft24Filled,
	CaretRight24Filled,
	ChevronRight24Regular,
} from "@fluentui/react-icons";
import { useEffect, useRef, useState } from "react";
import { getSongDetail } from "@/lib/services/song";
import type { creative, HomeBlock, Song } from "@/lib/types";
import { YeeButton } from "../yee-button";
import { PlaylistCard } from "./playlist-card";
import { SongPreview } from "./song-preview";
import { VoicePreview } from "./voice-preview";

interface SectionProps {
	block: HomeBlock;
}
export const SUPPORTED_TYPES = [
	"HOMEPAGE_SLIDE_PLAYLIST",
	"HOMEPAGE_SLIDE_SONGLIST_ALIGN",
	"HOMPAGE_VIP_SONG_RCMD",
	"SLIDE_RCMDLIKE_VOICELIST",
];
function getPagePositions(
	container: HTMLDivElement,
	itemsPerPage: number | undefined,
) {
	const childElements = Array.from(container.children) as HTMLElement[];
	if (childElements.length === 0) return [0];
	const containerRect = container.getBoundingClientRect();
	const maxScrollLeft = Math.max(
		0,
		container.scrollWidth - container.clientWidth,
	);
	const epsilon = 1;
	const items = childElements
		.map((child) => {
			const rect = child.getBoundingClientRect();
			const start = rect.left - containerRect.left + container.scrollLeft;
			return { start, end: start + rect.width };
		})
		.sort((a, b) => a.start - b.start);
	if (itemsPerPage && itemsPerPage > 0) {
		return items
			.filter((_, index) => index % itemsPerPage === 0)
			.map((item) => Math.min(item.start, maxScrollLeft))
			.filter((position, index, arr) => arr.indexOf(position) === index);
	}
	const pagePositions = [0];
	let pageStart = 0;
	let pageEnd = container.clientWidth;
	for (const item of items) {
		if (item.end > pageEnd + epsilon) {
			pageStart = Math.min(item.start, maxScrollLeft);
			pageEnd = pageStart + container.clientWidth;
			if (pageStart > pagePositions[pagePositions.length - 1] + epsilon) {
				pagePositions.push(pageStart);
			}
		}
	}
	if (maxScrollLeft > pagePositions[pagePositions.length - 1] + epsilon) {
		pagePositions.push(maxScrollLeft);
	}
	return pagePositions;
}
function chunk<T>(arr: T[], size: number): T[][] {
	const result: T[][] = [];
	for (let i = 0; i < arr.length; i += size) {
		result.push(arr.slice(i, i + size));
	}
	return result;
} // ── Content renderers ────────────────────────────────────────────
function PlaylistContent({
	creatives,
	itemsPerPage,
}: {
	creatives: creative[];
	itemsPerPage: number;
}) {
	return creatives.map((creative) => (
		<div
			key={creative.creativeId}
			className="shrink-0"
			style={{
				flexBasis: `calc((100% - var(--section-gap) * ${itemsPerPage - 1}) / ${itemsPerPage})`,
			}}
		>
			{" "}
			<PlaylistCard resource={creative?.resources?.[0] || null} />{" "}
		</div>
	));
}
function SongListContent({ creatives }: { creatives: creative[] }) {
	const [songById, setSongById] = useState<Record<string, Song>>({});
	const idsKey = creatives
		.flatMap((c) => c.resources?.map((r) => r.resourceId) ?? [])
		.join(",");
	useEffect(() => {
		let cancelled = false;
		async function fetchSongDetails() {
			const ids = creatives
				.flatMap((c) => c.resources?.map((r) => r.resourceId) ?? [])
				.filter(Boolean);
			if (ids.length === 0) return;
			const details = await getSongDetail(ids);
			if (cancelled) return;
			const map: Record<string, Song> = {};
			for (const s of details ?? []) {
				if (s?.id != null) map[String(s.id)] = s;
			}
			setSongById(map);
		}
		fetchSongDetails();
		return () => {
			cancelled = true;
		};
	}, [idsKey]);
	return creatives.map((creative) => {
		const songs =
			creative.resources
				?.map((r) => songById[r.resourceId])
				.filter((s): s is Song => Boolean(s)) ?? [];
		return (
			<div
				key={creative.creativeId}
				className="shrink-0"
				style={{ flexBasis: "calc((100% - var(--section-gap)) / 2)" }}
			>
				{" "}
				<SongPreview songs={songs} />{" "}
			</div>
		);
	});
}
function VoiceListContent({ creatives }: { creatives: creative[] }) {
	return chunk(creatives, 3).map((group, i) => (
		<VoicePreview creatives={group} key={i} />
	));
} // ── Section ──────────────────────────────────────────────────────
export function Section({ block }: SectionProps) {
	if (!SUPPORTED_TYPES.includes(block.showType)) return null;
	const containerRef = useRef<HTMLDivElement>(null);
	const [playlistItemsPerPage, setPlaylistItemsPerPage] = useState(8);
	const [hasOverflow, setHasOverflow] = useState(false);
	const [canScrollPrev, setCanScrollPrev] = useState(false);
	const [canScrollNext, setCanScrollNext] = useState(false);
	const itemsPerPage =
		block.showType === "HOMEPAGE_SLIDE_PLAYLIST"
			? playlistItemsPerPage
			: block.showType === "HOMEPAGE_SLIDE_SONGLIST_ALIGN" ||
					block.showType === "HOMPAGE_VIP_SONG_RCMD"
				? 2
				: undefined;
	const updateScrollState = () => {
		const container = containerRef.current;
		if (!container) {
			setHasOverflow(false);
			setCanScrollPrev(false);
			setCanScrollNext(false);
			return;
		}
		const maxScrollLeft = container.scrollWidth - container.clientWidth;
		if (block.showType === "HOMEPAGE_SLIDE_PLAYLIST") {
			const width = container.clientWidth;
			const nextItemsPerPage = width >= 1760 ? 9 : width >= 1440 ? 8 : 7;
			setPlaylistItemsPerPage(nextItemsPerPage);
		}
		const epsilon = 1;
		const overflow = maxScrollLeft > epsilon;
		const pagePositions = getPagePositions(container, itemsPerPage);
		const currentScrollLeft = container.scrollLeft;
		const firstPage = pagePositions[0] ?? 0;
		const lastPage = pagePositions[pagePositions.length - 1] ?? 0;
		setHasOverflow(overflow);
		setCanScrollPrev(currentScrollLeft > firstPage + epsilon);
		setCanScrollNext(overflow && currentScrollLeft < lastPage - epsilon);
	};
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;
		updateScrollState();
		const observer = new ResizeObserver(updateScrollState);
		observer.observe(container);
		container.addEventListener("scroll", updateScrollState, { passive: true });
		window.addEventListener("resize", updateScrollState);
		return () => {
			observer.disconnect();
			container.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, [block.showType]);
	const scrollToChild = (direction: 1 | -1) => {
		const container = containerRef.current;
		if (!container) return;
		const pagePositions = getPagePositions(container, itemsPerPage);
		const currentScrollLeft = container.scrollLeft;
		const epsilon = 1;
		const target =
			direction > 0
				? (pagePositions.find(
						(position) => position > currentScrollLeft + epsilon,
					) ?? currentScrollLeft)
				: ([...pagePositions]
						.reverse()
						.find((position) => position < currentScrollLeft - epsilon) ??
					currentScrollLeft);
		container.scrollTo({ left: target, behavior: "smooth" });
	};
	const titleStr = block.uiElement?.subTitle?.title || "";
	const buttonText = block?.uiElement?.button?.text;
	const seeMore = typeof buttonText === "string" && buttonText.includes("更多");
	const creatives = block.creatives;
	const showType = block.showType;
	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-bold">
					<div
						className={`flex items-center gap-2 group transform transition duration-300 ease-in-out ${seeMore ? " hover:bg-foreground/5 rounded-md hover:translate-x-2 px-2 py-1 -ml-2 -mt-1" : ""}`}
					>
						{titleStr}
						{seeMore && (
							<ChevronRight24Regular className="size-5 text-foreground/60 group-hover:mr-1" />
						)}
					</div>
				</h2>
				<div className="flex gap-2 text-black/60 items-center">
					{hasOverflow && (
						<>
							<YeeButton
								variant="ghost"
								icon={<CaretLeft24Filled className="size-3" />}
								className="size-6 rounded-full bg-card border! border-border! text-muted-foreground hover:text-muted-foreground"
								onClick={() => scrollToChild(-1)}
								disabled={!canScrollPrev}
							/>
							<YeeButton
								variant="ghost"
								icon={<CaretRight24Filled className="size-3" />}
								className="size-6 rounded-full bg-card border! border-border! text-muted-foreground hover:text-muted-foreground"
								onClick={() => scrollToChild(1)}
								disabled={!canScrollNext}
							/>
						</>
					)}
				</div>
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
				{creatives && showType === "HOMEPAGE_SLIDE_PLAYLIST" && (
					<PlaylistContent
						creatives={creatives}
						itemsPerPage={playlistItemsPerPage}
					/>
				)}
				{creatives &&
					(showType === "HOMEPAGE_SLIDE_SONGLIST_ALIGN" ||
						showType === "HOMPAGE_VIP_SONG_RCMD") && (
						<SongListContent creatives={creatives} />
					)}
				{creatives && showType === "SLIDE_RCMDLIKE_VOICELIST" && (
					<VoiceListContent creatives={creatives} />
				)}
			</div>
		</section>
	);
}
