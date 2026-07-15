import {
  sfEllipsis,
  sfHeartSlashFill,
  sfInfinity,
  sfPauseFill,
  sfPlayFill,
  sfRepeat1,
  sfSpeakerFill,
  sfSpeakerWave3Fill,
} from "@bradleyhodges/sfsymbols";
import { SFIcon } from "@bradleyhodges/sfsymbols-react";
import {
  Heart24Filled,
  Heart24Regular,
  MusicNote224Filled,
} from "@fluentui/react-icons";
import {
  AnimatePresence,
  motion,
  type Transition,
  useAnimationControls,
} from "framer-motion";
import { useRef, useState } from "react";
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
type SkipDirection = "previous" | "next";

const DURATION_DISPLAY_MODES: DurationDisplayMode[] = ["total", "remaining"];

const lyricSheetEase = [0.16, 1, 0.3, 1] as const;

const songInfoEntrance = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const coverEntrance = {
  hidden: {
    opacity: 0,
    y: 42,
    scale: 0.9,
    filter: "blur(18px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.78,
      ease: lyricSheetEase,
    },
    // Clear the residual filter once settled — even blur(0px) creates a
    // stacking context, which would isolate the plus-lighter blended
    // controls below from the mesh background.
    transitionEnd: {
      filter: "none",
    },
  },
};

const detailEntrance = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(10px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.58,
      ease: lyricSheetEase,
    },
    transitionEnd: {
      filter: "none",
    },
  },
};

const playPauseIconEnterTransition = {
  type: "spring",
  stiffness: 300,
  damping: 22,
  mass: 0.72,
} as const;

const playPauseIconExitTransition = {
  type: "spring",
  stiffness: 420,
  damping: 30,
  mass: 0.56,
} as const;

const skipTriangleMoveTransition: Transition = {
  type: "spring",
  stiffness: 180,
  damping: 24,
  mass: 0.82,
};

const skipTriangleExitTransition: Transition = {
  duration: 0.24,
  ease: [0.32, 0, 0.67, 0],
};

const skipTriangleEnterTransition: Transition = {
  duration: 0.34,
  ease: [0.16, 1, 0.3, 1],
  delay: 0.2,
};

const skipTrianglePath =
  "M1.318 15.537c.391 0 .703-.166 1.114-.371L14.98 9.082c.83-.41 1.094-.791 1.094-1.309s-.264-.888-1.094-1.298L2.432.38C2.012.176 1.699.01 1.309.01.586.01.137.557.137 1.406l.01 12.735c0 .85.449 1.396 1.171 1.396";

const skipTriangleScale = 1.24;
const skipTriangleY = 10.36;
const skipTriangleSlotOffset = 19.85;

export function LyricSheetSonginfo({
  setIsOpen,
}: {
  setIsOpen: (v: boolean) => void;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center px-[clamp(4rem,6vw,7rem)] py-[clamp(1.5rem,3vh,3rem)]">
      <motion.div
        className="flex w-[clamp(28rem,44vh,34rem)] max-w-full flex-col items-stretch justify-center gap-[clamp(3.75rem,9vh,10rem)]"
        variants={songInfoEntrance}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={coverEntrance}>
          <SongCover />
        </motion.div>

        <div className="flex w-full flex-col gap-6">
          <motion.div variants={detailEntrance}>
            <SongMeta />
          </motion.div>

          <motion.div variants={detailEntrance}>
            <LyricSheetSonginfoDuration setIsOpen={setIsOpen} />
          </motion.div>

          <motion.div variants={detailEntrance}>
            <PlaybackControls />
          </motion.div>

          <motion.div variants={detailEntrance}>
            <VolumeControl />
          </motion.div>
        </div>
      </motion.div>
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

function SongMeta() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const openMenu = useContextMenuStore((s) => s.openMenu);

  const { likeListSet, toggleLikeMusic: toggleLike } = useUserStore();
  const isLike = likeListSet.has(currentSong?.id || 0);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;
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
      <div className="flex min-w-0 flex-1 flex-col">
        <Marquee
          text={currentSong?.name || ""}
          textClassName="text-xl font-bold leading-tight text-white/60 mix-blend-plus-lighter drop-shadow-md line-clamp-1 select-none"
        />
        <button
          type="button"
          className="mix-blend-plus-lighter -translate-x-2 w-fit max-w-full rounded-md border-0 bg-transparent px-2 py-0.5 text-left transition-colors duration-300 hover:bg-white/10"
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
            textClassName="text-lg font-normal leading-tight text-white/40 drop-shadow-md line-clamp-1 select-none"
          />
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-1">
        {!isLocalMusic && (
          <YeeButton
            variant="ghost"
            icon={<LikeIcon className="size-5" />}
            onClick={handleLike}
            className={cn(
              "size-9 rounded-full text-white/80 transition-all duration-300 ease-in-out bg-white/10 hover:bg-white/20 hover:text-white",
              isLike && "text-white",
            )}
          />
        )}
        <YeeButton
          variant="ghost"
          icon={<SFIcon icon={sfEllipsis} className="size-5" />}
          className="size-9 rounded-full text-white/80 transition-all duration-300 ease-in-out bg-white/10 hover:bg-white/20 hover:text-white"
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
          className="mix-blend-plus-lighter"
          trackClassName="h-2! origin-center bg-white/20 transition-transform duration-200 ease-out will-change-transform group-hover:scale-y-150"
          rangeClassName="h-full bg-white/40"
          showThumb={false}
        />
      </div>
      <div className="grid w-full grid-cols-3 items-center">
        <span className="text-left text-xs font-light text-white/40 select-none mix-blend-plus-lighter">
          {formatDuration(currentTime)}
        </span>

        <div className="flex justify-center">
          <LyricSheetAudioLevelModel setIsLyricSheetOpen={setIsOpen} />
        </div>

        <button
          type="button"
          className="-mr-2 justify-self-end rounded-sm border-0 px-2 py-1 text-right text-xs font-light text-white/40 tabular-nums transition-colors duration-300 ease-out select-none mix-blend-plus-lighter hover:bg-white/10"
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
        <SkipButton
          direction="previous"
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
          icon={<PlayPauseIcon isPlaying={isPlaying} />}
          onClick={() => togglePlay()}
          className="size-16 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10"
        />
      )}

      <SkipButton
        direction="next"
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

function PlayPauseIcon({ isPlaying }: { isPlaying: boolean }) {
  const icon = isPlaying ? sfPauseFill : sfPlayFill;

  return (
    <span className="relative flex size-10 items-center justify-center text-white drop-shadow-md">
      <AnimatePresence initial={false}>
        <motion.span
          key={isPlaying ? "pause" : "play"}
          className="absolute inset-0 flex origin-center items-center justify-center"
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
            transition: playPauseIconEnterTransition,
          }}
          exit={{
            scale: 0,
            transition: playPauseIconExitTransition,
          }}
        >
          <SFIcon
            icon={icon}
            className={cn("size-9", !isPlaying && "translate-x-0.5")}
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function SkipButton({
  direction,
  onClick,
  className,
}: {
  direction: SkipDirection;
  onClick: () => void;
  className?: string;
}) {
  const incomingTriangleControls = useAnimationControls();
  const leftTriangleControls = useAnimationControls();
  const rightTriangleControls = useAnimationControls();
  const animationRunRef = useRef(0);

  function handleClick() {
    const animationRun = animationRunRef.current + 1;
    animationRunRef.current = animationRun;

    incomingTriangleControls.stop();
    leftTriangleControls.stop();
    rightTriangleControls.stop();

    incomingTriangleControls.set({
      x: -skipTriangleSlotOffset,
      opacity: 0,
      scale: 0.98,
    });
    leftTriangleControls.set({ x: 0, opacity: 1, scale: 1 });
    rightTriangleControls.set({ x: 0, opacity: 1, scale: 1 });

    void Promise.all([
      leftTriangleControls.start({
        x: skipTriangleSlotOffset,
        transition: skipTriangleMoveTransition,
      }),
      rightTriangleControls.start({
        x: skipTriangleSlotOffset + 4,
        opacity: 0,
        scale: 0.96,
        transition: skipTriangleExitTransition,
      }),
      incomingTriangleControls.start({
        x: 0,
        opacity: 1,
        scale: 1,
        transition: skipTriangleEnterTransition,
      }),
    ]).then(() => {
      if (animationRunRef.current !== animationRun) return;

      incomingTriangleControls.set({
        x: -skipTriangleSlotOffset,
        opacity: 0,
        scale: 0.98,
      });
      leftTriangleControls.set({ x: 0, opacity: 1, scale: 1 });
      rightTriangleControls.set({ x: 0, opacity: 1, scale: 1 });
    });

    onClick();
  }

  return (
    <YeeButton
      variant="ghost"
      icon={
        <svg
          aria-hidden="true"
          viewBox="0 0 40 40"
          className={cn(
            "size-10 overflow-hidden text-white drop-shadow-md",
            direction === "previous" && "-scale-x-100",
          )}
        >
          <motion.g
            initial={{
              x: -skipTriangleSlotOffset,
              opacity: 0,
              scale: 0.98,
            }}
            animate={incomingTriangleControls}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <path
              d={skipTrianglePath}
              fill="currentColor"
              fillOpacity={0.85}
              transform={`translate(0.2 ${skipTriangleY}) scale(${skipTriangleScale})`}
            />
          </motion.g>
          <motion.g
            animate={rightTriangleControls}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <path
              d={skipTrianglePath}
              fill="currentColor"
              fillOpacity={0.85}
              transform={`translate(20.05 ${skipTriangleY}) scale(${skipTriangleScale})`}
            />
          </motion.g>
          <motion.g
            animate={leftTriangleControls}
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
          >
            <path
              d={skipTrianglePath}
              fill="currentColor"
              fillOpacity={0.85}
              transform={`translate(0.2 ${skipTriangleY}) scale(${skipTriangleScale})`}
            />
          </motion.g>
        </svg>
      }
      onClick={handleClick}
      className={className}
    />
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
          className="mix-blend-plus-lighter"
          trackClassName="h-2! origin-center bg-white/18 transition-transform duration-200 ease-out will-change-transform group-hover:scale-y-150"
          rangeClassName="h-full bg-white/40"
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
