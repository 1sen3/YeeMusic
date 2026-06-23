import { Album24Regular } from "@fluentui/react-icons";
import { ContextMenuButton } from "../context-menu-button";
import { ActionProps } from "./action";
import { useNavigate } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";

export function PlaylistActions({ type, data }: ActionProps) {
	if (type !== "list" && data.resourceType !== "list") return null;

	const { closeMenu } = useContextMenuStore();
	const navigate = useNavigate();

	return (
		<>
			<ContextMenuButton
				id="playlist-info"
				icon={<Album24Regular className="size-4" />}
				content="查看歌单"
				onClick={(e) => {
					e.stopPropagation();

					closeMenu();
					navigate(`/detail/playlist?id=${data.id}`);
				}}
			/>
		</>
	);
}
