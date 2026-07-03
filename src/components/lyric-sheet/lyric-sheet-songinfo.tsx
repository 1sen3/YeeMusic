import {
  sfBackwardFill,
  sfForwardFill,
  sfHeartSlashFill,
  sfInfinity,
  sfPauseFill,
  sfPlayFill,
  sfQuoteBubble,
  sfQuoteBubbleFill,
  sfRepeat1,
  sfSpeakerFill,
  sfSpeakerWave3Fill,
} from "@bradleyhodges/sfsymbols";
import { SFIcon } from "@bradleyhodges/sfsymbols-react";
import {
  Heart24Filled,
  Heart24Regular,
  List24Filled,
  List24Regular,
  MoreHorizontal24Filled,
  MusicNote224Filled,
} from "@fluentui/react-icons";
import { useState } from "react";
import { toast } from "sonner";
import {
  REPEAT_MODE_BY_TYPE,
  SHUFFLE_MODE_BY_TYPE,
} from "@/lib/constants/player";
import { likeSong } from "@/lib/services/user";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { cn, formatDuration, GetThumbnail } from "@/lib/utils";
import { Marquee } from "../marquee/marquee";
import { Spinner } from "../ui/spinner";
import { YeeButton } from "../yee-button";
import { YeeSlider } from "../yee-slider";
import { LyricSheetAudioLevelModel } from "./lyric-sheet-audio-level-modal";

type DurationDisplayMode = "total" | "remaining";

const DURATION_DISPLAY_MODES: DurationDisplayMode[] = ["total", "remaining"];

export function LyricSheetSonginfo({
  setIsOpen,
  isPlaylistOpen,
  onPlaylistOpenChangeAction,
  isLyricOpen,
  onLyricOpenChangeAction,
}: {
  setIsOpen: (v: boolean) => void;
  isPlaylistOpen: boolean;
  onPlaylistOpenChangeAction: (v: boolean) => void;
  isLyricOpen: boolean;
  onLyricOpenChangeAction: (v: boolean) => void;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-[clamp(4rem,6vw,7rem)] py-[clamp(1.5rem,3vh,3rem)]">
      <div className="flex w-[clamp(28rem,44vh,34rem)] max-w-full flex-col items-stretch justify-center gap-[clamp(3.75rem,9vh,10rem)]">
        <SongCover />

        <div className="flex w-full flex-col gap-6">
          <SongMeta
            isPlaylistOpen={isPlaylistOpen}
            onPlaylistOpenChangeAction={onPlaylistOpenChangeAction}
            isLyricOpen={isLyricOpen}
            onLyricOpenChangeAction={onLyricOpenChangeAction}
          />

          <LyricSheetSonginfoDuration setIsOpen={setIsOpen} />

          <PlaybackControls />

          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

function SongCover() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const coverUrl = currentSong?.al?.picUrl;

  return (
    <div className="flex w-full items-center justify-center">
      <div className="relative aspect-square w-[clamp(22rem,36vh,28rem)] max-w-full overflow-hidden rounded-lg shadow-[0_12px_24px_rgba(0,0,0,0.05),0_32px_64px_rgba(0,0,0,0.1)]">
        {coverUrl ? (
          <img
            src={GetThumbnail(
              currentSong?.al?.picUrl || currentSong?.album?.picUrl || "",
              1000,
            )}
            alt={`${currentSong?.name} 封面`}
            className="size-full object-cover select-none"
          />
        ) : (
          <div className="flex size-full transform items-center justify-center bg-card text-foreground/40 transition-all duration-300 ease-in-out group-hover:brightness-50">
            <MusicNote224Filled className="size-28" />
          </div>
        )}
      </div>
    </div>
  );
}

function SongMeta({
  isPlaylistOpen,
  onPlaylistOpenChangeAction,
  isLyricOpen,
  onLyricOpenChangeAction,
}: {
  isPlaylistOpen: boolean;
  onPlaylistOpenChangeAction: (v: boolean) => void;
  isLyricOpen: boolean;
  onLyricOpenChangeAction: (v: boolean) => void;
}) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const openMenu = useContextMenuStore((s) => s.openMenu);

  const { likeListSet, toggleLikeMusic: toggleLike } = useUserStore();
  const isLike = likeListSet.has(currentSong?.id || 0);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;
  const PlaylistIcon = isPlaylistOpen ? List24Filled : List24Regular;
  const lyricIcon = isLyricOpen ? sfQuoteBubbleFill : sfQuoteBubble;
  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const isLocalMusic = currentSong?.localFilePath !== undefined;

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();

    if (!currentSong || !currentSong.id) return;

    const targetLike = !isLike;
    toggleLike(currentSong.id, targetLike);

    try {
      const res = await likeSong(currentSong.id, targetLike);
      if (!res) {
        toggleLike(currentSong.id, isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
      }
    } catch (error) {
      toggleLike(currentSong.id, isLike);
      toast.error("操作失败，请稍后重试...", { position: "top-center" });
      console.error("喜欢歌曲失败", error);
    }
  }

  const artistStr = currentSong?.ar?.map((ar) => ar.name).join("、");

  return (
    <div className="flex w-full items-end justify-between gap-10">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Marquee
          text={currentSong?.name || ""}
          textClassName="text-xl font-semibold leading-tight text-white/80 mix-blend-plus-lighter drop-shadow-md line-clamp-1 select-none"
        />
        <button
          type="button"
          className="-translate-x-2 w-fit max-w-full rounded-md border-0 bg-transparent px-2 py-0.5 text-left transition-colors duration-300 hover:bg-white/10"
          onClick={(e) => {
            openMenu(
              e.clientX + 10,
              e.clientY - 80,
              "song-artist-info",
              currentSong,
            );
          }}
        >
          <Marquee
            text={artistStr || ""}
            textClassName="text-lg font-medium leading-tight text-white/45 mix-blend-plus-lighter drop-shadow-md line-clamp-1 select-none"
          />
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-1">
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon icon={lyricIcon} className={cn("size-5 drop-shadow-md")} />
          }
          onClick={() => {
            onLyricOpenChangeAction(!isLyricOpen);
            onPlaylistOpenChangeAction(false);
          }}
          className={cn(
            "size-9 rounded-full text-white transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
          )}
        />
        {!isFmMode && (
          <YeeButton
            variant="ghost"
            icon={<PlaylistIcon className="size-5 drop-shadow-md" />}
            onClick={() => {
              onPlaylistOpenChangeAction(!isPlaylistOpen);
              onLyricOpenChangeAction(false);
            }}
            className={cn(
              "size-9 rounded-full text-white transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
            )}
          />
        )}
        {!isLocalMusic && (
          <YeeButton
            variant="ghost"
            icon={<LikeIcon className="size-5 drop-shadow-md" />}
            onClick={handleLike}
            className={cn(
              "size-9 rounded-full text-white/55 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
              isLike && "text-white",
            )}
          />
        )}
        <YeeButton
          variant="ghost"
          icon={<MoreHorizontal24Filled className="size-5 drop-shadow-md" />}
          className="size-9 rounded-full text-white/55 transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            openMenu(e.clientX + 10, e.clientY - 80, "song", currentSong);
          }}
        />
      </div>
    </div>
  );
}

function LyricSheetSonginfoDuration({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const duration = usePlayerStore((s) => s.duration);
  const [durationDisplayMode, setDurationDisplayMode] =
    useState<DurationDisplayMode>("total");

  const remainingTime = Math.max(duration - currentTime, 0);
  const durationText =
    durationDisplayMode === "remaining"
      ? `-${formatDuration(remainingTime)}`
      : formatDuration(duration);

  function toggleDurationDisplayMode() {
    setDurationDisplayMode((current) => {
      const currentIndex = DURATION_DISPLAY_MODES.indexOf(current);
      return DURATION_DISPLAY_MODES[
        (currentIndex + 1) % DURATION_DISPLAY_MODES.length
      ];
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-2 items-center">
        <YeeSlider
          value={[progress]}
          onValueChange={seek}
          max={100}
          step={0.1}
          trackClassName="h-2! origin-center bg-white/20 mix-blend-plus-lighter transition-transform duration-200 ease-out will-change-transform group-hover:scale-y-125"
          rangeClassName="h-full bg-white/65"
          showThumb={false}
        />
      </div>
      <div className="grid w-full grid-cols-3 items-center">
        <span className="text-left text-xs font-light text-white/45 select-none">
          {formatDuration(currentTime)}
        </span>

        <div className="flex justify-center">
          <LyricSheetAudioLevelModel setIsLyricSheetOpen={setIsOpen} />
        </div>

        <button
          type="button"
          className="-mr-2 justify-self-end rounded-sm border-0 px-2 py-1 text-right text-xs font-light text-white/45 tabular-nums transition-colors duration-300 ease-out select-none mix-blend-plus-lighter backdrop-blur-md hover:bg-white/10"
          onClick={toggleDurationDisplayMode}
        >
          {durationText}
        </button>
      </div>
    </div>
  );
}

function PlaybackControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatType = usePlayerStore((s) => s.repeatMode);
  const shuffleType = usePlayerStore((s) => s.isShuffle);
  const isLoadingMusic = usePlayerStore((s) => s.isLoadingMusic);
  const PlayIcon = isPlaying ? sfPauseFill : sfPlayFill;
  const repeatModeConfig =
    REPEAT_MODE_BY_TYPE[repeatType] || REPEAT_MODE_BY_TYPE.order;
  const shuffleConfig =
    SHUFFLE_MODE_BY_TYPE[shuffleType] || SHUFFLE_MODE_BY_TYPE.off;
  const canShuffle = repeatModeConfig.canShuffle;

  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const fmRepeatMode = usePlayerStore((s) => s.fmRepeatMode);
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);
  const toggleFmRepeatMode = usePlayerStore((s) => s.toggleFmRepeatMode);

  const { togglePlay, prev, next, toggleRepeatMode, toggleShuffleMode } =
    usePlayerStore();

  return (
    <div className="flex shrink-0 items-center justify-between pt-4">
      <YeeButton
        variant="ghost"
        icon={
          <SFIcon
            icon={shuffleConfig.icon}
            className={cn("size-5 drop-shadow-md")}
          />
        }
        onClick={toggleShuffleMode}
        disabled={!canShuffle || isFmMode}
        className={cn(
          "size-10 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
          (!canShuffle || shuffleType === "off") && "text-white/50",
        )}
      />

      {isFmMode ? (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon icon={sfHeartSlashFill} className="size-8 drop-shadow-md" />
          }
          onClick={trashFmSong}
          className="size-16 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
        />
      ) : (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon icon={sfBackwardFill} className="size-10 drop-shadow-md" />
          }
          onClick={() => prev(true)}
          className="size-16 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
        />
      )}

      {isLoadingMusic ? (
        <div className="flex h-16 w-16 items-center justify-center">
          <Spinner className="size-8 drop-shadow-2xl" />
        </div>
      ) : (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon
              icon={PlayIcon}
              className="size-10 text-white drop-shadow-md"
            />
          }
          onClick={() => togglePlay()}
          className="size-16 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10"
        />
      )}

      <YeeButton
        variant="ghost"
        icon={
          <SFIcon icon={sfForwardFill} className="size-10 drop-shadow-md" />
        }
        onClick={() => next(true)}
        className="size-16 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white"
      />

      {isFmMode ? (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon
              icon={fmRepeatMode ? sfRepeat1 : sfInfinity}
              className="size-5 drop-shadow-md"
            />
          }
          onClick={toggleFmRepeatMode}
          className={cn(
            "size-10 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
          )}
        />
      ) : (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon
              icon={repeatModeConfig.icon}
              className={cn("size-5 drop-shadow-md")}
            />
          }
          onClick={toggleRepeatMode}
          className={cn(
            "size-10 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white",
            repeatType === "order" && "text-white/50",
          )}
        />
      )}
    </div>
  );
}

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const updateVolume = usePlayerStore((s) => s.updateVolume);

  return (
    <div className="flex w-full items-center justify-between gap-5 pt-2">
      <SFIcon
        icon={sfSpeakerFill}
        className="size-4 text-white/50 transition-all duration-300 mix-blend-plus-lighter hover:scale-110 hover:text-white/70"
        onClick={() => {
          if (volume <= 0) return;
          updateVolume(volume - 0.1);
        }}
      />

      <div className="flex h-3 w-full items-center">
        <YeeSlider
          value={[volume]}
          onValueChange={updateVolume}
          max={1}
          step={0.01}
          trackClassName="h-2! origin-center bg-white/18 mix-blend-plus-lighter transition-transform duration-200 ease-out will-change-transform group-hover:scale-y-125"
          rangeClassName="h-full bg-white/55"
          tooltip={`音量：${volume * 100}`}
          showThumb={false}
        />
      </div>

      <SFIcon
        icon={sfSpeakerWave3Fill}
        className="size-6 text-white/50 transition-all duration-300 mix-blend-plus-lighter drop-shadow-md hover:scale-110 hover:text-white/70"
        onClick={() => {
          if (volume >= 1) return;
          updateVolume(volume + 0.1);
        }}
      />
    </div>
  );
}
