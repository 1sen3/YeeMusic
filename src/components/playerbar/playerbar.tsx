import { useSongLogic } from "@/hooks/use-song-logic";
import {
  REPEAT_MODE_BY_TYPE,
  SHUFFLE_MODE_BY_TYPE,
} from "@/lib/constants/player";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { GetThumbnail, cn } from "@/lib/utils";
import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal20Regular,
  MusicNote224Filled,
} from "@fluentui/react-icons";
import {
  sfArrowDownBackwardAndArrowUpForwardSquareFill,
  sfBackwardFill,
  sfBrandItunesNote,
  sfForwardFill,
  sfHeartSlashFill,
  sfInfinity,
  sfPauseFill,
  sfPlayFill,
  sfRepeat1,
} from "@bradleyhodges/sfsymbols";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { Link } from "react-router-dom";
import { LyricSheet } from "../lyric-sheet/lyric-sheet";
import { Marquee } from "../marquee/marquee";
import { YeeButton } from "../yee-button";
import { MusicLevelPopover } from "../music-level-popover";
import { PlayerBarVolumePopover } from "./player-bar-volume-popover";
import { PlayerBarSlider } from "./playerbar-slider";
import { PlaylistSheet } from "./playlist-sheet";

export function PlayerBar() {
  return (
    <div
      className="grid h-20 w-full grid-cols-[minmax(190px,200px)_auto_minmax(220px,1fr)_auto] items-center gap-3 border-t bg-card/60"
      onContextMenu={(e) => e.preventDefault()}
    >
      <LeftButtonRegion />
      <CenterButtonRegion />
      <PlayerBarSlider />
      <RightButtonRegion />
    </div>
  );
}

function LeftButtonRegion() {
  const { checkIsLiked, handleLike } = useSongLogic();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isLike = checkIsLiked("song", currentSong);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;
  const songStr = currentSong?.name || "";

  return (
    <div className="flex min-w-0 items-center gap-3 overflow-hidden pl-4">
      {currentSong ? (
        <>
          <LyricSheet>
            <div className="group relative shrink-0">
              <div className="relative h-12 w-12 overflow-hidden rounded-sm border shadow-sm">
                {currentSong?.al?.picUrl ? (
                  <img
                    src={GetThumbnail(
                      currentSong.al?.picUrl || currentSong.album?.picUrl || "",
                    )}
                    alt="Album cover"
                    loading="eager"
                    className="h-12 w-12 transition-[filter] duration-150 ease-[ease] group-hover:brightness-50"
                    draggable={false}
                  />
                ) : (
                  <div className="flex size-12 items-center justify-center bg-card text-foreground/40 transition-[filter] duration-150 ease-[ease] group-hover:brightness-50">
                    <MusicNote224Filled />
                  </div>
                )}
              </div>
              <SFIcon
                icon={sfArrowDownBackwardAndArrowUpForwardSquareFill}
                className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-150 ease-[ease] group-hover:opacity-100"
              />
            </div>
          </LyricSheet>
          <div className="min-w-0 flex-1">
            <Marquee text={songStr} textClassName="text-sm font-bold" />
            <div className="line-clamp-1">
              {currentSong?.ar?.map((ar, idx) => (
                <Link
                  to={`/detail/artist?id=${ar.id}`}
                  key={`${ar.id}-${idx}`}
                  className="text-foreground/60 text-sm hover:text-foreground/80"
                  draggable={false}
                >
                  {ar.name}
                  {idx < currentSong!.ar!.length - 1 && "、"}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <YeeButton
              variant="ghost"
              onClick={() => handleLike("song", currentSong)}
              icon={
                <LikeIcon className={cn("size-4", isLike && "text-red-500")} />
              }
            />
          </div>
        </>
      ) : (
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-sm border shadow-sm">
          <SFIcon icon={sfBrandItunesNote} className="size-5 text-black/40" />
        </div>
      )}
    </div>
  );
}

function CenterButtonRegion() {
  const { togglePlay, next, prev, toggleShuffleMode, toggleRepeatMode } =
    usePlayerStore();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatType = usePlayerStore((s) => s.repeatMode);
  const shuffleType = usePlayerStore((s) => s.isShuffle);
  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const fmRepeatMode = usePlayerStore((s) => s.fmRepeatMode);
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);
  const toggleFmRepeatMode = usePlayerStore((s) => s.toggleFmRepeatMode);
  const PlayIcon = isPlaying ? sfPauseFill : sfPlayFill;
  const repeatModeConfig =
    REPEAT_MODE_BY_TYPE[repeatType] || REPEAT_MODE_BY_TYPE.order;
  const shuffleConfig =
    SHUFFLE_MODE_BY_TYPE[shuffleType] || SHUFFLE_MODE_BY_TYPE.off;
  const canShuffle = repeatModeConfig.canShuffle;

  return (
    <div className="flex shrink-0 items-center justify-center gap-4">
      <YeeButton
        variant="ghost"
        disabled={!canShuffle || isFmMode}
        onClick={toggleShuffleMode}
        icon={<SFIcon icon={shuffleConfig.icon} className="size-4" />}
        className={cn(
          shuffleType === "on" ? "text-foreground" : "text-foreground/50",
        )}
      />
      {isFmMode ? (
        <YeeButton
          variant="ghost"
          onClick={trashFmSong}
          icon={<SFIcon icon={sfHeartSlashFill} className="size-5" />}
        />
      ) : (
        <YeeButton
          variant="ghost"
          onClick={() => prev(true)}
          icon={<SFIcon icon={sfBackwardFill} className="size-5" />}
        />
      )}
      <YeeButton
        variant="ghost"
        onClick={() => togglePlay()}
        icon={<SFIcon icon={PlayIcon} className="size-4" />}
      />
      <YeeButton
        variant="ghost"
        onClick={() => next(true)}
        icon={<SFIcon icon={sfForwardFill} className="size-5" />}
      />
      {isFmMode ? (
        <YeeButton
          variant="ghost"
          onClick={toggleFmRepeatMode}
          icon={
            <SFIcon
              icon={fmRepeatMode ? sfRepeat1 : sfInfinity}
              className="size-4 text-foreground/80"
            />
          }
        />
      ) : (
        <YeeButton
          variant="ghost"
          onClick={toggleRepeatMode}
          icon={<SFIcon icon={repeatModeConfig.icon} className="size-4" />}
          className={cn(
            repeatType !== "order" ? "text-foreground!" : "text-foreground/50!",
          )}
        />
      )}
    </div>
  );
}

function RightButtonRegion() {
  const openMenu = useContextMenuStore((s) => s.openMenu);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isFmMode = usePlayerStore((s) => s.isFmMode);

  return (
    <div className="flex shrink-0 items-center justify-end gap-4 pr-4">
      <MusicLevelPopover />
      {!isFmMode && <PlaylistSheet />}
      <PlayerBarVolumePopover />
      <YeeButton
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          openMenu(e.clientX, e.clientY, "song", currentSong);
        }}
        icon={<MoreHorizontal20Regular className="size-5" />}
      />
    </div>
  );
}
