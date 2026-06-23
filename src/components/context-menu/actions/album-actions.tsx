import { Album24Regular } from "@fluentui/react-icons";
import { ContextMenuButton } from "../context-menu-button";
import { ActionProps } from "./action";
import { useNavigate } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";

export function AlbumActions({ type, data }: ActionProps) {
	if (type !== "album" && data.resourceType !== "album") return null;

	const { closeMenu } = useContextMenuStore();
	const navigate = useNavigate();

	return (
		<>
			<ContextMenuButton
				id="album-info"
				icon={<Album24Regular className="size-4" />}
				content="查看专辑"
				onClick={(e) => {
					e.stopPropagation();

					closeMenu();
					navigate(`/detail/album?id=${data.id}`);
				}}
			/>
		</>
	);
}
