import { Album24Regular, Person24Regular } from "@fluentui/react-icons";
import { ContextMenuButton } from "../context-menu-button";
import { ActionProps } from "./action";
import { useNavigate } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { Song } from "@/lib/types";
import { useAppWindow } from "@/hooks/use-app-window";
import { requestCloseLyricSheet } from "@/lib/events/lyric-sheet";

export function SongArtistInfoActions({ type, data }: ActionProps) {
	if (type !== "song-artist-info" && data.resourceType !== "song") return null;

	const { closeMenu } = useContextMenuStore();
	const navigate = useNavigate();

	const albumStr = (data as Song).al.name;
	const albumId = (data as Song).al.id;

	const artistList = (data as Song).ar;
	const artistStr = (data as Song).ar?.map((ar) => ar.name).join("、");
	const artistId = (data as Song).ar?.[0].id;

	const { isFullscreen, toggleFullscreen } = useAppWindow();
	const navigateToDetail = (path: string) => {
		closeMenu();
		requestCloseLyricSheet();
		navigate(path);
	};

	return (
		<>
			<ContextMenuButton
				id="playlist-info"
				icon={<Album24Regular className="size-4" />}
				content={
					<div className="flex flex-col">
						<span>前往专辑</span>
						<span className="line-clamp-1 text-foreground/50">{albumStr}</span>
					</div>
				}
				onClick={(e) => {
					e.stopPropagation();
					if (isFullscreen) toggleFullscreen();

					navigateToDetail(`/detail/album?id=${albumId}`);
				}}
			/>
			<ContextMenuButton
				id="playlist-info"
				icon={<Person24Regular className="size-4" />}
				content={
					<div className="flex flex-col">
						<span>前往艺人</span>
						<span className="line-clamp-1 text-foreground/50">{artistStr}</span>
					</div>
				}
				hasSubmenu={artistList.length >= 2}
				onClick={(e) => {
					e.stopPropagation();
					if (artistList.length >= 2) return;

					if (isFullscreen) toggleFullscreen();

					navigateToDetail(`/detail/artist?id=${artistId}`);
				}}
			>
				{artistList.map((ar) => (
					<ContextMenuButton
						id={`artist-${ar.id}`}
						key={ar.id}
						content={ar.name}
						onClick={() => {
							if (isFullscreen) toggleFullscreen();

							console.log(`/detail/artist?id=${ar.id}`);

							navigateToDetail(`/detail/artist?id=${ar.id}`);
						}}
					/>
				))}
			</ContextMenuButton>
		</>
	);
}
