import { sfPlayCircleFill } from "@bradleyhodges/sfsymbols";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { Link } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import type { Playlist } from "@/lib/types";
import { GetThumbnail } from "@/lib/utils";

export function PlaylistCoverCard({ playlist }: { playlist: Playlist }) {
	const playList = usePlayerStore((s) => s.playList);
	const openMenu = useContextMenuStore((s) => s.openMenu);

	return (
		<div
			className="flex w-full flex-col gap-3"
			onContextMenu={(e) => {
				e.preventDefault();
				openMenu(e.clientX, e.clientY, "playlist", playlist);
			}}
		>
			<div className="group aspect-square w-full overflow-hidden rounded-lg border drop-shadow-md">
				<div className="relative h-full w-full">
					<Link
						to={`/detail/playlist?id=${playlist.id}`}
						className="cursor-default"
					>
						<img
							className="h-full w-full object-cover transition duration-300"
							src={GetThumbnail(playlist.coverImgUrl ?? "")}
							alt={`${playlist.name} 封面`}
						/>
						<div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition duration-300 group-hover:opacity-100">
							<SFIcon
								icon={sfPlayCircleFill}
								className="size-8 transition-all duration-300 hover:scale-110"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									playList(playlist.id, "list");
								}}
							/>
						</div>
					</Link>
				</div>
			</div>
			<div className="flex w-full flex-col gap-0.5 overflow-hidden">
				<p className="line-clamp-2 w-full select-text font-medium text-sm">
					{playlist.name}
				</p>
				<span className="text-foreground/60 text-xs">
					{playlist.trackCount} 首
				</span>
			</div>
		</div>
	);
}
