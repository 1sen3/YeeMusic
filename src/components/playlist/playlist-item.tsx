import { Playlist } from "@/lib/types";
import { Play24Filled } from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { Link } from "react-router-dom";
import { YeeButton } from "../yee-button";
import { GetThumbnail } from "@/lib/utils";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";

export function PlaylistItem({ playlist }: { playlist: Playlist }) {
  const playList = usePlayerStore((s) => s.playList);
  const openMenu = useContextMenuStore((s) => s.openMenu);

  return (
    <div
      className="flex gap-4"
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, "playlist", playlist);
      }}
    >
      <div className="size-24 relative rounded-md overflow-hidden drop-shadow-md cursor-pointer group">
        <Link to={`/detail/playlist?id=${playlist.id}`}>
          <img
            src={GetThumbnail(playlist.coverImgUrl!)}
            alt={`${playlist.name} cover`}
            className="group-hover:brightness-60 transition-all duration-300 object-cover"
          />
        </Link>
      </div>
      <div className="flex flex-col justify-between items-start">
        <div className="flex flex-col">
          <span className="font-semibold text-md">{playlist.name}</span>
          <span className="text-foreground/60 text-sm">
            {playlist.creator.nickname}
          </span>
        </div>
        <YeeButton
          variant="outline"
          className="bg-white"
          icon={<Play24Filled className="size-4" />}
          onClick={() => playList(playlist.id, "list")}
        />
      </div>
    </div>
  );
}
