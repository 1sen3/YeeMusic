import { Song } from "@/lib/types";
import { GetThumbnail, cn, formatDuration } from "@/lib/utils";
import {
  MoreHorizontal24Regular,
  MusicNote224Filled,
  Play24Filled,
} from "@fluentui/react-icons";
import { Button } from "../ui/button";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { Link } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import React from "react";
import { AudioLinesIcon } from "./audio-lines-icon";

export function SongListItem({
  song,
  index,
  showCover = true,
  showAlbum = true,
}: {
  song: Song;
  index: number;
  showCover: boolean;
  showAlbum?: boolean;
}) {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const playSong = usePlayerStore((s) => s.playSong);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const gridTemplate = showAlbum
    ? "grid-cols-[1fr_1fr_1fr_52px_26px]"
    : "grid-cols-[1fr_1fr_52px_26px]";

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    openMenu(e.clientX, e.clientY, "song", song);
  }

  const isPlaying = currentSong?.id === song.id;

  const coverUrl = song.al.picUrl;
  const isLocalMusic = song.localFilePath !== undefined;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col hover:bg-foreground/8 rounded-md",
        index % 2 === 0 && "bg-foreground/5",
        "transition-colors duration-300",
      )}
      onDoubleClick={() => playSong(song)}
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={handleContextMenu}
    >
      <div className={`grid ${gridTemplate} items-center px-4 py-3 group`}>
        <div className="flex gap-4 items-center ">
          {showCover ? (
            <div className="w-10 h-10 relative rounded-sm overflow-hidden shrink-0 group cursor-pointer border">
              {coverUrl && coverUrl.length > 0 ? (
                <img
                  src={GetThumbnail(song.al.picUrl!)}
                  alt={`${song.al?.name}专辑封面`}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-card flex items-center justify-center">
                  <MusicNote224Filled className="size-5 text-muted-foreground" />
                </div>
              )}

              {!isPlaying && (
                <div
                  className="absolute w-10 h-10 left-1/2 top-1/2 -translate-1/2 group-hover:bg-black/50 flex justify-center items-center"
                  onClick={() => playSong(song)}
                >
                  <Play24Filled className="opacity-0 group-hover:opacity-100 size-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white transition-opacity" />
                </div>
              )}
              {isPlaying && (
                <div
                  className="absolute w-10 h-10 left-1/2 top-1/2 -translate-1/2 bg-black/50 flex justify-center items-center"
                  onClick={() => togglePlay()}
                >
                  <AudioLinesIcon className="text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="size-6 flex items-center justify-center text-foreground/40 relative">
              {!isPlaying && (
                <>
                  <span className="group-hover:hidden">{index + 1}</span>
                  <div
                    className="hidden group-hover:flex hover:text-foreground/60 cursor-pointer"
                    onClick={() => playSong(song)}
                  >
                    <Play24Filled className="size-4" />
                  </div>
                </>
              )}
              {isPlaying && (
                <div
                  className="absolute left-1/2 top-1/2 -translate-1/2 text-black cursor-pointer"
                  onClick={() => togglePlay()}
                >
                  <AudioLinesIcon className="text-foreground/40 hover:text-foreground/60" />
                </div>
              )}
            </div>
          )}
          <span className="line-clamp-1 w-3/4 font-semibold text-sm">
            {song.name}
          </span>
        </div>

        <div className="line-clamp-1 w-3/4">
          {song.ar!.map((ar, idx) =>
            isLocalMusic ? (
              <span className="text-foreground/60 text-sm font-medium">
                {ar.name}
              </span>
            ) : (
              <Link
                key={`${song.id}-${ar.id}-${idx}`}
                to={`/detail/artist?id=${ar.id}`}
              >
                <span className="text-foreground/60 hover:text-foreground/80 cursor-pointer text-sm font-medium">
                  {ar.name}
                  {idx < song.ar!.length - 1 && "、"}
                </span>
              </Link>
            ),
          )}
        </div>

        {showAlbum &&
          (song.al.name ? (
            isLocalMusic ? (
              <span className="line-clamp-1 w-3/4 text-foreground/60 text-sm">
                {song.al.name}
              </span>
            ) : (
              <Link to={`/detail/album?id=${song.al.id}`}>
                <span className="line-clamp-1 w-3/4 text-foreground/60 hover:text-foreground/80 cursor-pointer text-sm">
                  {song.al.name}
                </span>
              </Link>
            )
          ) : (
            <span className="line-clamp-1 w-3/4 text-foreground/60 text-sm">
              未知专辑
            </span>
          ))}

        <span className=" text-foreground/40 text-sm">
          {formatDuration((song.dt || 1) / 1000)}
        </span>
        <span>
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={handleContextMenu}
          >
            <MoreHorizontal24Regular className="size-4" />
          </Button>
        </span>
      </div>
    </div>
  );
}
