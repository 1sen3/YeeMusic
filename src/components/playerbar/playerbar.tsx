import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal20Regular,
  Next24Filled,
  Pause24Filled,
  Play24Filled,
  Previous24Filled,
  SlideSize24Regular,
} from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";
import { GetThumbnail, cn } from "@/lib/utils";

import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { Spinner } from "@/components/ui/spinner";
import { PlaylistSheet } from "./playlist-sheet";
import { MusicLevelPopover } from "../music-level-popover";
import { LyricSheet } from "../lyric-sheet/lyric-sheet";
import { Link } from "react-router-dom";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import {
  sfBrandItunesNote,
  sfHeartSlashFill,
  sfInfinity,
  sfRepeat1,
} from "@bradleyhodges/sfsymbols";
import { YeeButton } from "../yee-button";
import { PlayerBarVolumePopover } from "./player-bar-volume-popover";
import { PlayerBarSlider } from "./playerbar-slider";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { useSongLogic } from "@/hooks/use-song-logic";

export function PlayerBar() {
  return (
    <div
      className="w-full h-20 grid grid-cols-3 relative bg-card/60 border-t"
      onContextMenu={(e) => e.preventDefault()}
    >
      <LeftButtonRegion />

      <CenterButtonRegion />

      <RightButtonRegion />

      <PlayerBarSlider />
    </div>
  );
}

function LeftButtonRegion() {
  const { checkIsLiked, handleLike } = useSongLogic();
  const currentSong = usePlayerStore((s) => s.currentSong);

  const isLike = checkIsLiked("song", currentSong);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;

  return (
    <div className="gap-4 min-w-0 flex items-center pl-4 overflow-hidden">
      {currentSong ? (
        <>
          <LyricSheet>
            <div className="shrink-0 relative group cursor-pointer">
              <div className="w-12 h-12 rounded-sm overflow-hidden relative border shadow-sm">
                <img
                  src={GetThumbnail(
                    currentSong.al?.picUrl || currentSong.album?.picUrl || "",
                  )}
                  alt="Album cover"
                  loading="eager"
                  className="w-12 h-12 group-hover:brightness-50 transform transition-all duration-300 ease-in-out"
                />
              </div>
              <SlideSize24Regular className="opacity-0 group-hover:opacity-100 size-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white  transform transition-all duration-300 ease-in-out" />
            </div>
          </LyricSheet>

          <div>
            <span className="text-sm line-clamp-1 font-semibold">
              {currentSong?.name || ""}
            </span>

            <div className="line-clamp-1">
              {currentSong?.ar?.map((ar, idx) => (
                <Link
                  to={`/detail/artist?id=${ar.id}`}
                  key={`${ar.id}-${idx}`}
                  className="text-sm text-foreground/60 hover:text-foreground/80"
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
        <div className="w-12 h-12 rounded-sm overflow-hidden border shadow-sm flex justify-center items-center">
          <SFIcon icon={sfBrandItunesNote} className="size-5 text-black/40" />
        </div>
      )}
    </div>
  );
}

function CenterButtonRegion() {
  const { togglePlay, next, prev, toggleShuffleMode, toggleRepeatMode } =
    usePlayerStore();

  const isLoadingMusic = usePlayerStore((s) => s.isLoadingMusic);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const fmRepeatMode = usePlayerStore((s) => s.fmRepeatMode);
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);
  const toggleFmRepeatMode = usePlayerStore((s) => s.toggleFmRepeatMode);

  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;
  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const shuffleConfig = SHUFFLE_CONFIG[isShuffle ? "on" : "off"];

  const canShuffle = repeatModeConfig.canShuffle;

  return (
    <div className=" flex items-center justify-center gap-4 shrink-0">
      <YeeButton
        variant="ghost"
        disabled={!canShuffle || isFmMode}
        onClick={toggleShuffleMode}
        icon={<shuffleConfig.icon className="size-4" />}
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
          onClick={prev}
          icon={<Previous24Filled className="size-5" />}
        />
      )}

      {isLoadingMusic ? (
        <div className="w-12 h-12 flex items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : (
        <YeeButton
          variant="ghost"
          onClick={() => togglePlay()}
          icon={<PlayIcon className="size-5" />}
        />
      )}

      <YeeButton
        variant="ghost"
        onClick={next}
        icon={<Next24Filled className="size-5" />}
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
          icon={<repeatModeConfig.icon className="size-4" />}
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
    <div className="flex items-center justify-end gap-4 shrink-0 pr-4">
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
