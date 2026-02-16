"use client";

import Image from "next/image";
import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal24Filled,
  Next24Filled,
  Pause24Filled,
  Play24Filled,
  Previous24Filled,
  SlideSize24Regular,
} from "@fluentui/react-icons";
import { usePlayerStore } from "@/lib/store/playerStore";
import { cn } from "@/lib/utils";

import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { Spinner } from "@/components/ui/spinner";
import { useUserStore } from "@/lib/store/userStore";
import { toast } from "sonner";
import { likeSong } from "@/lib/services/user";
import { PlaylistSheet } from "./playlist-sheet";
import { MusicLevelPopover } from "../music-level-popover";
import { LyricSheet } from "../lyric-sheet/lyric-sheet";
import Link from "next/link";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { sfBrandItunesNote } from "@bradleyhodges/sfsymbols";
import { YeeButton } from "../yee-button";
import { PlayerBarVolumePopover } from "./player-bar-volume-popover";
import { PlayerBarSlider } from "./playerbar-slider";

export function PlayerBar() {
  return (
    <div
      className={cn(
        "absolute bottom-8 left-1/2 -translate-x-1/2 w-5/6 h-20 bg-white/90 backdrop-blur z-50 rounded-full",
        "inset-shadow-xs inset-shadow-gray-700/10 drop-shadow-lg",
      )}
    >
      <div className=" h-full px-8 grid grid-cols-3">
        <LeftButtonRegion />

        <CenterButtonRegion />

        <RightButtonRegion />

        <PlayerBarSlider />
      </div>
    </div>
  );
}

function LeftButtonRegion() {
  const { likeListSet, toggleLike } = useUserStore();
  const currentSong = usePlayerStore((s) => s.currentSong);

  const isLike = likeListSet.has(Number(currentSong?.id));
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();

    if (!currentSong) return;

    const targetState = !isLike;

    toggleLike(Number(currentSong?.id), targetState);

    try {
      const res = await likeSong(currentSong?.id, targetState);

      if (!res) {
        toggleLike(Number(currentSong?.id), isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
      }
    } catch (error) {
      toggleLike(Number(currentSong?.id), isLike);
      toast.error("操作失败，请稍后重试...", { position: "top-center" });
      console.log("切换歌曲喜欢状态失败", error);
    }
  }

  return (
    <div className="gap-4 min-w-0 flex items-center">
      {currentSong ? (
        <>
          <LyricSheet>
            <div className="shrink-0 relative group cursor-pointer">
              <div className="w-12 h-12 rounded-sm overflow-hidden relative border shadow-sm">
                <Image
                  src={currentSong.al?.picUrl || ""}
                  alt="Album cover"
                  loading="eager"
                  fill
                  className="group-hover:brightness-50 transform transition-all duration-300 ease-in-out"
                />
              </div>
              <SlideSize24Regular className="opacity-0 group-hover:opacity-100 size-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white  transform transition-all duration-300 ease-in-out" />
            </div>
          </LyricSheet>

          <div>
            <span className="text-sm line-clamp-1 font-semibold">
              {currentSong?.name || ""}
            </span>

            <div className="line-clamp-1">
              {currentSong?.ar?.map((ar, idx) => (
                <Link
                  href={`/detail/artist/${ar.id}`}
                  key={`${ar.id}-${idx}`}
                  className="text-sm text-black/60 hover:text-black/80"
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
              onClick={handleLike}
              icon={
                <LikeIcon className={cn("size-5", isLike && "text-red-500")} />
              }
            />
          </div>
        </>
      ) : (
        <div className="w-12 h-12 rounded-sm overflow-hidden border shadow-sm flex justify-center items-center">
          <SFIcon icon={sfBrandItunesNote} className="size-6 text-black/40" />
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

  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;
  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const shuffleConfig = SHUFFLE_CONFIG[isShuffle ? "on" : "off"];

  const canShuffle = repeatModeConfig.canShuffle;

  return (
    <div className=" flex items-center justify-center gap-4 shrink-0">
      <YeeButton
        variant="ghost"
        disabled={!canShuffle}
        onClick={toggleShuffleMode}
        icon={<shuffleConfig.icon className="size-5" />}
      />

      <YeeButton
        variant="ghost"
        onClick={prev}
        icon={<Previous24Filled className="size-6" />}
      />

      {isLoadingMusic ? (
        <div className="w-12 h-12 flex items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : (
        <YeeButton
          variant="ghost"
          onClick={() => togglePlay()}
          icon={<PlayIcon className="size-6" />}
        />
      )}

      <YeeButton
        variant="ghost"
        onClick={next}
        icon={<Next24Filled className="size-6" />}
      />

      <YeeButton
        variant="ghost"
        onClick={toggleRepeatMode}
        icon={<repeatModeConfig.icon className="size-5" />}
      />
    </div>
  );
}

function RightButtonRegion() {
  return (
    <div className="flex items-center justify-end gap-4 shrink-0">
      <MusicLevelPopover variant="light" />

      <PlaylistSheet />

      <PlayerBarVolumePopover />

      <YeeButton
        variant="ghost"
        onClick={() => {}}
        icon={<MoreHorizontal24Filled className="size-6" />}
      />
    </div>
  );
}
