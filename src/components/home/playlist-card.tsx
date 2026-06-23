"use client";
import { Resource } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Play28Filled } from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { Link } from "react-router-dom";
import { GetThumbnail } from "@/lib/utils";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
export function PlaylistCard({ resource }: { resource: Resource | null }) {
	const { playList } = usePlayerStore();
	const openMenu = useContextMenuStore((s) => s.openMenu);
	function handlePlay() {
		if (resource?.resourceId) {
			if (resource?.resourceType !== "song")
				playList(resource.resourceId, resource.resourceType);
		}
	}
	if (!resource) {
		return (
			<div className="w-full flex flex-col gap-3">
				{" "}
				<div className="w-full aspect-square rounded-lg overflow-hidden">
					{" "}
					<Skeleton className="w-full h-full" />{" "}
				</div>{" "}
				<div className="flex flex-col gap-3 w-full">
					{" "}
					<Skeleton className="w-full h-4" /> <Skeleton className="w-16 h-4" />{" "}
				</div>{" "}
			</div>
		);
	}
	const uiElement = resource.uiElement;
	const title =
		uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
	const cover = uiElement?.image?.imageUrl || "";
	return (
		<div
			className="w-full flex flex-col gap-4"
			onContextMenu={(e) => {
				e.preventDefault();
				openMenu(e.clientX, e.clientY, "playlist", resource);
			}}
		>
			{" "}
			<div className="w-full aspect-square rounded-lg drop-shadow-md overflow-hidden group border">
				{" "}
				<div className="w-full h-full relative group">
					{" "}
					<Link to={`/detail/playlist?id=${resource.resourceId}`}>
						{" "}
						<img
							className="transition duration-300 w-full h-full object-cover"
							src={GetThumbnail(cover)}
							alt="Album cover"
						/>{" "}
						<div className="bg-black/50 opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center transition duration-300 text-white hover:text-gray-200">
							{" "}
							<Play28Filled
								className="hover:scale-110 transition-transform"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handlePlay();
								}}
							/>{" "}
						</div>{" "}
					</Link>{" "}
				</div>{" "}
			</div>{" "}
			<div className="flex flex-col gap-0.5 w-full overflow-hidden">
				{" "}
				<p className="w-full line-clamp-2 text-sm font-medium select-text">
					{" "}
					{title.split("|")[0]}{" "}
				</p>{" "}
			</div>{" "}
		</div>
	);
}
