import { Song } from "@/lib/types";
import { SongListItem } from "./song-list-item";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { YeeButton } from "../yee-button";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { sfArrowUp, sfScope } from "@bradleyhodges/sfsymbols";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SongList({
	songList,
	showCover = true,
	showAlbum = false,
	sortable = false,
	onReorder,
	itemClassName,
	itemSecondaryClassName,
	itemMetaClassName,
}: {
	songList: Song[];
	showCover?: boolean;
	showAlbum?: boolean;
	sortable?: boolean;
	onReorder?: (from: number, to: number) => void;
	/** 透传给 SongListItem 的行容器/歌手专辑列/弱文字类名覆盖 */
	itemClassName?: string;
	itemSecondaryClassName?: string;
	itemMetaClassName?: string;
}) {
	const { currentSong } = usePlayerStore();

	const [isVisible, setIsVisible] = useState(false);
	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const sentineRef = useRef<HTMLDivElement>(null);

	const canReorder = sortable && !!onReorder;
	const dragIndexRef = useRef<number | null>(null);
	const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
	const [dropTarget, setDropTarget] = useState<{
		index: number;
		position: "above" | "below";
	} | null>(null);

	const resetDragState = () => {
		dragIndexRef.current = null;
		setDraggingIndex(null);
		setDropTarget(null);
	};

	const handleDrop = (index: number, position: "above" | "below") => {
		const from = dragIndexRef.current;
		resetDragState();
		if (from === null || !onReorder) return;

		const insertAt = position === "above" ? index : index + 1;
		const to = from < insertAt ? insertAt - 1 : insertAt;
		if (to !== from) onReorder(from, to);
	};

	const currentSongIndex = useMemo(() => {
		if (!currentSong) return -1;
		return songList.findIndex((s) => s.id === currentSong.id);
	}, [currentSong, songList]);

	const scrollToCurrentSong = () => {
		if (currentSongIndex !== -1) {
			virtuosoRef.current?.scrollToIndex({
				index: currentSongIndex,
				align: "center",
				behavior: "smooth",
			});
		}
	};

	const scrollToTop = () => {
		virtuosoRef.current?.scrollToIndex({
			index: 0,
			align: "center",
			behavior: "smooth",
		});
	};

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				setIsVisible(!entry.isIntersecting);
			},
			{
				root: document.getElementById("main-scroll-container") as HTMLElement,
				threshold: 0,
			},
		);

		if (sentineRef.current) {
			observer.observe(sentineRef.current);
		}

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<>
			<div ref={sentineRef} />

			<Virtuoso
				ref={virtuosoRef}
				useWindowScroll
				customScrollParent={
					document.getElementById("main-scroll-container") as HTMLElement
				}
				data={songList}
				itemContent={(index, song) => (
					<div
						className={cn(
							"relative pb-4",
							draggingIndex === index && "opacity-40",
						)}
						draggable={canReorder}
						onDragStart={
							canReorder
								? (e) => {
										// 根布局的 main 容器上有全局 onDragStart preventDefault，
										// 阻止冒泡以免排序拖拽被取消
										e.stopPropagation();
										dragIndexRef.current = index;
										setDraggingIndex(index);
										e.dataTransfer.effectAllowed = "move";
										e.dataTransfer.setData("text/plain", song.id.toString());
									}
								: undefined
						}
						onDragOver={
							canReorder
								? (e) => {
										if (dragIndexRef.current === null) return;
										e.preventDefault();
										e.dataTransfer.dropEffect = "move";
										const rect = e.currentTarget.getBoundingClientRect();
										const position =
											e.clientY < rect.top + rect.height / 2
												? "above"
												: "below";
										setDropTarget((prev) =>
											prev?.index === index && prev.position === position
												? prev
												: { index, position },
										);
									}
								: undefined
						}
						onDrop={
							canReorder
								? (e) => {
										e.preventDefault();
										const rect = e.currentTarget.getBoundingClientRect();
										handleDrop(
											index,
											e.clientY < rect.top + rect.height / 2
												? "above"
												: "below",
										);
									}
								: undefined
						}
						onDragEnd={canReorder ? resetDragState : undefined}
					>
						<SongListItem
							song={song}
							index={index}
							showCover={showCover}
							showAlbum={showAlbum}
							className={itemClassName}
							secondaryClassName={itemSecondaryClassName}
							metaClassName={itemMetaClassName}
						/>
						{dropTarget?.index === index && draggingIndex !== index && (
							<div
								className={cn(
									"pointer-events-none absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary",
									dropTarget.position === "above"
										? "-top-2"
										: "bottom-2",
								)}
							/>
						)}
					</div>
				)}
			/>
			<div className="fixed bottom-28 right-8 flex">
				{currentSongIndex !== -1 && (
					<YeeButton
						variant="glass"
						icon={<SFIcon icon={sfScope} />}
						disabled={currentSongIndex === -1}
						onClick={scrollToCurrentSong}
					/>
				)}

				<YeeButton
					className={cn(
						"transition-all duration-300 ease-in-out",
						isVisible
							? "opacity-100 translate-x-0 ml-4"
							: "opacity-0 translate-x-4 -ml-8 pointer-events-none",
					)}
					variant="glass"
					icon={<SFIcon icon={sfArrowUp} />}
					onClick={scrollToTop}
				/>
			</div>
		</>
	);
}
