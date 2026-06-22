import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import {
  Heart24Filled,
  Heart24Regular,
  List24Filled,
  List24Regular,
  MoreHorizontal24Filled,
  MusicNote224Filled,
} from "@fluentui/react-icons";
import { Spinner } from "../ui/spinner";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { likeSong } from "@/lib/services/user";
import { toast } from "sonner";
import { YeeSlider } from "../yee-slider";
import { GetThumbnail, cn, formatDuration } from "@/lib/utils";
import { LyricSheetAudioLevelModel } from "./lyric-sheet-audio-level-modal";
import { SFIcon } from "@bradleyhodges/sfsymbols-react";
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
import { YeeButton } from "../yee-button";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { Marquee } from "../marquee/marquee";
import {
  REPEAT_MODE_BY_TYPE,
  SHUFFLE_MODE_BY_TYPE,
} from "@/lib/constants/player";
import { useState } from "react";

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
    <div className="w-full h-full flex flex-col items-center">
      <SongCover />

      <div className="flex flex-col gap-4 w-104 h-1/2 justify-center">
        <SongMeta
          setIsOpen={setIsOpen}
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
  );
}

function SongCover() {
  const currentSong = usePlayerStore((s) => s.currentSong);

  const coverUrl = currentSong?.al?.picUrl;

  return (
    <div className="w-full h-1/2 flex items-center justify-center translate-y-14">
      <div className="relative size-78 rounded-lg drop-shadow-2xl overflow-hidden border border-white/10">
        {coverUrl ? (
          <img
            src={GetThumbnail(
              currentSong?.al?.picUrl || currentSong?.album?.picUrl || "",
              1000,
            )}
            alt={`${currentSong?.name} 封面`}
            className="size-78 object-cover select-none"
          />
        ) : (
          <div className="bg-card size-78 flex items-center justify-center text-foreground/40 group-hover:brightness-50 transform transition-all duration-300 ease-in-out">
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
  setIsOpen: (v: boolean) => void;
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
    <div className="flex justify-between items-center">
      <div className="w-4/7 flex flex-col gap-0">
        <Marquee
          text={currentSong?.name || ""}
          textClassName="text-xl font-bold text-white/80 drop-shadow-md mix-blend-overlay line-clamp-1 select-none"
        />
        <div
          className="hover:bg-background/10 px-2 -translate-x-2 rounded-md cursor-pointer transition-colors duration-300 w-fit max-w-full"
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
            textClassName="text-xl text-white/60 drop-shadow-md mix-blend-overlay line-clamp-1 select-none"
          />
        </div>
      </div>
      <div className="flex gap-2">
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
            "hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
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
            className="size-8 hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
          />
        )}
        {!isLocalMusic && (
          <YeeButton
            variant="ghost"
            icon={<LikeIcon className="size-5 drop-shadow-md" />}
            onClick={handleLike}
            className="size-8 hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
          />
        )}
        <YeeButton
          variant="ghost"
          icon={<MoreHorizontal24Filled className="size-5 drop-shadow-md" />}
          className=" size-8 hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
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
      <div className="h-3 flex items-center">
        <YeeSlider
          value={[progress]}
          onValueChange={seek}
          max={100}
          step={0.1}
          trackClassName="bg-white/20 backdrop-brightness-200 h-2! group-hover:h-3! transition-[height] mix-blend-plus-lighter duration-300 ease-out backdrop-blur-lg"
          rangeClassName="bg-white/60 backdrop-brightness-150 h-2! group-hover:h-3! transition-[height]  duration-300 ease-out"
          showThumb={false}
        />
      </div>
      <div className="grid grid-cols-3 w-full items-center ">
        <span className="text-white/40 font-light  text-left select-none">
          {formatDuration(currentTime)}
        </span>

        <div className="flex justify-center">
          <LyricSheetAudioLevelModel setIsLyricSheetOpen={setIsOpen} />
        </div>

        <button
          type="button"
          className="justify-self-end text-white/40 font-light text-right select-none tabular-nums border-0 mix-blend-plus-lighter backdrop-blur-md rounded-sm hover:bg-background/50 hover:text-white/60 px-2 py-1 -mr-2 cursor-pointer transition-colors duration-300 ease-out"
          onClick={toggleDurationDisplayMode}
          title={
            durationDisplayMode === "remaining" ? "剩余时长" : "歌曲总时长"
          }
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
    REPEAT_MODE_BY_TYPE[repeatType] || REPEAT_MODE_BY_TYPE["order"];
  const shuffleConfig =
    SHUFFLE_MODE_BY_TYPE[shuffleType] || SHUFFLE_MODE_BY_TYPE["off"];
  const canShuffle = repeatModeConfig.canShuffle;

  const isFmMode = usePlayerStore((s) => s.isFmMode);
  const fmRepeatMode = usePlayerStore((s) => s.fmRepeatMode);
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);
  const toggleFmRepeatMode = usePlayerStore((s) => s.toggleFmRepeatMode);

  const { togglePlay, prev, next, toggleRepeatMode, toggleShuffleMode } =
    usePlayerStore();

  return (
    <div className=" flex items-center justify-between shrink-0 my-4">
      <YeeButton
        variant="ghost"
        icon={
          <SFIcon
            icon={shuffleConfig.icon}
            className={cn(
              "size-5 drop-shadow-md",
              shuffleType === "on" &&
                "drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]",
            )}
          />
        }
        onClick={toggleShuffleMode}
        disabled={!canShuffle || isFmMode}
        className={cn(
          "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
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
          className="size-12 hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
        />
      ) : (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon icon={sfBackwardFill} className="size-10 drop-shadow-md" />
          }
          onClick={() => prev(true)}
          className="size-16 hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
        />
      )}

      {isLoadingMusic ? (
        <div className="w-16 h-16 flex items-center justify-center">
          <Spinner className="size-8 drop-shadow-2xl" />
        </div>
      ) : (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon
              icon={PlayIcon}
              className="size-10 drop-shadow-md text-white"
            />
          }
          onClick={() => togglePlay()}
          className="size-16 cursor-pointer hover:bg-white/10 rounded-full transition-all duration-300 ease-in-out"
        />
      )}

      <YeeButton
        variant="ghost"
        icon={
          <SFIcon icon={sfForwardFill} className="size-10 drop-shadow-md" />
        }
        onClick={() => next(true)}
        className="size-16 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
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
            "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
          )}
        />
      ) : (
        <YeeButton
          variant="ghost"
          icon={
            <SFIcon
              icon={repeatModeConfig.icon}
              className={cn(
                "size-5 drop-shadow-md",
                repeatType !== "order" &&
                  "drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]",
              )}
            />
          }
          onClick={toggleRepeatMode}
          className={cn(
            "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
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
    <div className="w-full flex gap-4 justify-between items-center">
      <SFIcon
        icon={sfSpeakerFill}
        className="size-4 text-white/40 mix-blend-plus-lighter hover:text-white/60 hover:scale-110 transition-all duration-300 cursor-pointer"
        onClick={() => {
          if (volume <= 0) return;
          updateVolume(volume - 0.1);
        }}
      />

      <div className="w-full h-3 flex items-center">
        <YeeSlider
          value={[volume]}
          onValueChange={updateVolume}
          max={1}
          step={0.01}
          trackClassName="bg-white/20 backdrop-brightness-200 h-2! group-hover:h-3! transition-[height] mix-blend-plus-lighter duration-300 ease-out backdrop-blur-lg"
          rangeClassName="bg-white/60 backdrop-brightness-120 h-2! group-hover:h-3! transition-[height] duration-300 ease-out"
          tooltip={`音量：${volume * 100}`}
          showThumb={false}
        />
      </div>

      <SFIcon
        icon={sfSpeakerWave3Fill}
        className="size-6 text-white/40 drop-shadow-md mix-blend-plus-lighter hover:text-white/60 hover:scale-110 transition-all duration-300 cursor-pointer"
        onClick={() => {
          if (volume >= 1) return;
          updateVolume(volume + 0.1);
        }}
      />
    </div>
  );
}
