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
}: {
	songList: Song[];
	showCover?: boolean;
	showAlbum?: boolean;
}) {
	const { currentSong } = usePlayerStore();

	const [isVisible, setIsVisible] = useState(false);
	const virtuosoRef = useRef<VirtuosoHandle>(null);
	const sentineRef = useRef<HTMLDivElement>(null);

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
					<div className="pb-4">
						<SongListItem
							song={song}
							index={index}
							showCover={showCover}
							showAlbum={showAlbum}
						/>
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
