"use client";

import { usePlayerStore } from "@/lib/store/playerStore";
import {
  CommentQuote24Filled,
  CommentQuote24Regular,
  Heart24Filled,
  Heart24Regular,
  List24Filled,
  List24Regular,
  MoreHorizontal24Filled,
  Next24Filled,
  Pause24Filled,
  Play24Filled,
  Previous24Filled,
  Speaker024Filled,
  Speaker224Filled,
} from "@fluentui/react-icons";
import Image from "next/image";
import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { Spinner } from "../ui/spinner";
import { useUserStore } from "@/lib/store/userStore";
import { likeSong } from "@/lib/services/user";
import { toast } from "sonner";
import { YeeSlider } from "../YeeSlider";
import { cn, formatTime } from "@/lib/utils";
import { Button } from "../ui/button";
import { MusicLevelModal } from "../modal/music-level-modal";
import { SFIcon } from "@bradleyhodges/sfsymbols-react";
import { sfQuoteBubble, sfQuoteBubbleFill } from "@bradleyhodges/sfsymbols";
import Link from "next/link";

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
    <div className="w-full h-full flex flex-col items-center justify-between ">
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

          <LyricSheetSonginfoDuration />

          <PlaybackControls />

          <VolumeControl />
        </div>
      </div>
    </div>
  );
}

function SongCover() {
  const currentSong = usePlayerStore((s) => s.currentSong);

  return (
    <div className="w-full h-1/2 flex items-center justify-center">
      <div className="w-64 h-64 relative rounded-lg shadow-xl overflow-hidden">
        <Image src={currentSong?.al?.picUrl || ""} alt="" fill />
      </div>
    </div>
  );
}

function SongMeta({
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
  const currentSong = usePlayerStore((s) => s.currentSong);

  const { likeListSet, toggleLike } = useUserStore();
  const isLike = likeListSet.has(currentSong?.id || 0);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;
  const PlaylistIcon = isPlaylistOpen ? List24Filled : List24Regular;
  const lyricIcon = isLyricOpen ? sfQuoteBubbleFill : sfQuoteBubble;

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

  return (
    <div className="flex justify-between items-center">
      <div className="w-4/7 flex flex-col gap-0">
        <span className="text-xl font-bold text-white/80 saturate-50 drop-shadow-md mix-blend-overlay line-clamp-1">
          {currentSong?.name}
        </span>
        <div className="line-clamp-1">
          {currentSong?.ar?.map((ar, idx) => (
            <Link
              href={`/detail/artist/${ar.id}`}
              key={`${ar.id}-${idx}`}
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xl text-white/60 drop-shadow-md mix-blend-overlay hover:text-white/50">
                {ar.name}
                {idx < currentSong.ar!.length - 1 && "、"}
              </span>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="drop-shadow-md size-8 cursor-pointer hover:bg-white/20 hover:text-white rounded-full transition-all duration-300 ease-in-out"
          variant="ghost"
          size="icon"
          onClick={() => {
            onLyricOpenChangeAction(!isLyricOpen);
            onPlaylistOpenChangeAction(false);
          }}
        >
          <SFIcon icon={lyricIcon} className="size-5" />
        </Button>
        <Button
          className="drop-shadow-md size-8 cursor-pointer hover:bg-white/20 hover:text-white rounded-full transition-all duration-300 ease-in-out"
          variant="ghost"
          size="icon"
          onClick={() => {
            onPlaylistOpenChangeAction(!isPlaylistOpen);
            onLyricOpenChangeAction(false);
          }}
        >
          <PlaylistIcon className="size-5" />
        </Button>
        <Button
          className="drop-shadow-md size-8 cursor-pointer hover:bg-white/20 hover:text-white rounded-full transition-all duration-300 ease-in-out"
          variant="ghost"
          size="icon"
          onClick={handleLike}
        >
          <LikeIcon className="size-5" />
        </Button>
        <Button
          className="drop-shadow-md size-8 cursor-pointer hover:bg-white/20 hover:text-white rounded-full transition-all duration-300 ease-in-out"
          variant="ghost"
          size="icon"
        >
          <MoreHorizontal24Filled className="size-5" />
        </Button>
      </div>
    </div>
  );
}

function LyricSheetSonginfoDuration() {
  const currentTime = usePlayerStore((s) => s.currentTime);
  const progress = usePlayerStore((s) => s.progress);
  const seek = usePlayerStore((s) => s.seek);
  const duration = usePlayerStore((s) => s.duration);

  return (
    <div className="flex flex-col gap-4">
      <div className="h-3 flex items-center">
        <YeeSlider
          value={[progress]}
          onValueChange={seek}
          max={100}
          step={0.1}
          trackClassName="bg-white/20 h-2! group-hover:h-3! transition-[height] duration-200"
          rangeClassName="bg-white/60 h-2! group-hover:h-3! transition-[height] duration-200"
          showThumb={false}
        />
      </div>
      <div className="grid grid-cols-3 w-full items-center">
        <span className="text-white/50 font-light drop-shadow-md text-left">
          {formatTime(currentTime)}
        </span>

        <div className="flex justify-center">
          <MusicLevelModal />
        </div>

        <span className="text-white/50 font-light drop-shadow-md text-right">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}

function PlaybackControls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isShuffle = usePlayerStore((s) => s.isShuffle);
  const isLoadingMusic = usePlayerStore((s) => s.isLoadingMusic);
  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;
  const shuffleKey = isShuffle ? "on" : "off";
  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const shuffleConfig = SHUFFLE_CONFIG[shuffleKey];
  const canShuffle = repeatModeConfig.canShuffle;

  const { togglePlay, prev, next, toggleRepeatMode, toggleShuffleMode } =
    usePlayerStore();

  return (
    <div className=" flex items-center justify-between shrink-0 my-4">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
          !isShuffle && "text-white/50",
        )}
        disabled={!canShuffle}
        onClick={toggleShuffleMode}
      >
        <shuffleConfig.icon className="size-5 drop-shadow-md" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-12 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
        onClick={prev}
      >
        <Previous24Filled className="size-8" />
      </Button>

      {isLoadingMusic ? (
        <div className="w-16 h-16 flex items-center justify-center">
          <Spinner className="size-8 drop-shadow-2xl" />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="size-16 cursor-pointer hover:bg-white/10 rounded-full transition-all duration-300 ease-in-out"
          onClick={() => togglePlay()}
        >
          <PlayIcon className="size-12 drop-shadow-2xl text-white" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="size-12 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
        onClick={next}
      >
        <Next24Filled className="size-8 drop-shadow-2xl" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
          repeatMode === "order" && "text-white/50",
        )}
        onClick={toggleRepeatMode}
      >
        <repeatModeConfig.icon className="size-5 drop-shadow-md" />
      </Button>
    </div>
  );
}

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const updateVolume = usePlayerStore((s) => s.updateVolume);

  return (
    <div className="w-full flex gap-2 justify-between items-center">
      <Speaker024Filled className="size-5 text-white/70" />

      <div className="w-full h-3 flex items-center">
        <YeeSlider
          value={[volume]}
          onValueChange={updateVolume}
          max={1}
          step={0.01}
          trackClassName="bg-white/20 h-2! group-hover:h-3! transition-[height]"
          rangeClassName="bg-white/60 h-2! group-hover:h-3! transition-[height]"
          tooltip={`音量：${volume * 100}`}
          showThumb={false}
        />
      </div>

      <Speaker224Filled className="size-5 text-white/70 drop-shadow-md" />
    </div>
  );
}
