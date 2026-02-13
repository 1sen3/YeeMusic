"use client";

import { Button } from "../ui/button";
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
  Speaker224Regular,
} from "@fluentui/react-icons";
import { Slider } from "../ui/slider";
import { usePlayerStore } from "@/lib/store/playerStore";
import { cn, formatTime } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { Spinner } from "@/components/ui/spinner";
import { YeeSlider } from "../YeeSlider";
import { useUserStore } from "@/lib/store/userStore";
import { toast } from "sonner";
import { likeSong } from "@/lib/services/user";
import { PlaylistSheet } from "./playlist-sheet";
import { MusicLevelPopover } from "../music-level-popover";
import { LyricSheet } from "../lyric-sheet/lyric-sheet";
import Link from "next/link";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { sfBrandItunesNote } from "@bradleyhodges/sfsymbols";

export function PlayerBar() {
  const player = usePlayerStore();

  const hasSongInList = player.currentSong !== null;
  const isPlaying = player.isPlaying;
  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;

  const repeatMode = player.repeatMode;
  const isShuffle = player.isShuffle ? "on" : "off";

  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const shuffleConfig = SHUFFLE_CONFIG[isShuffle];

  const canShuffle = repeatModeConfig.canShuffle;

  const { likeListSet, toggleLike } = useUserStore();
  const isLike = likeListSet.has(Number(player.currentSong?.id));
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;

  async function handleLike(e: React.MouseEvent) {
    e.stopPropagation();

    if (!player.currentSong) return;

    const targetState = !isLike;

    toggleLike(Number(player.currentSong?.id), targetState);

    try {
      const res = await likeSong(player.currentSong?.id, targetState);

      if (!res) {
        toggleLike(Number(player.currentSong?.id), isLike);
        toast.error("操作失败，请稍后重试...", { position: "top-center" });
      }
    } catch (error) {
      toggleLike(Number(player.currentSong?.id), isLike);
      toast.error("操作失败，请稍后重试...", { position: "top-center" });
      console.log("切换歌曲喜欢状态失败", error);
    }
  }

  return (
    <div
      className={cn(
        "absolute bottom-8 left-1/2 -translate-x-1/2 w-5/6 h-20 bg-white/90 backdrop-blur z-50 rounded-full",
        "inset-shadow-xs inset-shadow-gray-700/10 drop-shadow-lg",
      )}
    >
      <div className=" h-full px-8 grid grid-cols-3">
        <div className="gap-4 min-w-0 flex items-center">
          {player.currentSong ? (
            <>
              <LyricSheet>
                <div className="shrink-0 relative group cursor-pointer">
                  <div className="w-12 h-12 rounded-sm overflow-hidden relative border shadow-sm">
                    <Image
                      src={player.currentSong.al?.picUrl || ""}
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
                <p className="text-sm line-clamp-1 font-semibold">
                  {player.currentSong?.name || ""}
                </p>

                <div className="line-clamp-1">
                  {player.currentSong?.ar?.map((ar, idx) => (
                    <Link
                      href={`/detail/artist/${ar.id}`}
                      key={`${ar.id}-${idx}`}
                    >
                      <span className="text-sm text-black/60 hover:text-black/80">
                        {ar.name}
                        {idx < player.currentSong!.ar!.length - 1 && "、"}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer"
                  onClick={handleLike}
                >
                  <LikeIcon
                    className={cn("size-5", isLike && "text-red-500")}
                  />
                </Button>
              </div>
            </>
          ) : (
            <div className="w-12 h-12 rounded-sm overflow-hidden border shadow-sm flex justify-center items-center">
              <SFIcon
                icon={sfBrandItunesNote}
                className="size-6 text-black/40"
              />
            </div>
          )}
        </div>

        <div className=" flex items-center justify-center gap-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            disabled={!canShuffle}
            onClick={player.toggleShuffleMode}
          >
            <shuffleConfig.icon className="size-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={player.prev}
          >
            <Previous24Filled className="size-6" />
          </Button>

          {player.isLoadingMusic ? (
            <div className="w-12 h-12 flex items-center justify-center">
              <Spinner className="size-5" />
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer"
              onClick={() => player.togglePlay()}
            >
              <PlayIcon className="size-6" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={player.next}
          >
            <Next24Filled className="size-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="cursor-pointer"
            onClick={player.toggleRepeatMode}
          >
            <repeatModeConfig.icon className="size-5" />
          </Button>
        </div>

        <div className="flex items-center justify-end gap-4 shrink-0">
          <MusicLevelPopover variant="light" />

          <PlaylistSheet />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className=" cursor-pointer">
                <Speaker224Regular className="size-6" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              sideOffset={32}
              className="w-48 rounded-full"
            >
              <div className="flex gap-4 px-2">
                <Slider
                  value={[player.volume]}
                  onValueChange={(value) => player.updateVolume(value[0])}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <span className="w-10 text-right">
                  {Math.round(player.volume * 100)}%
                </span>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="cursor-pointer">
            <MoreHorizontal24Filled className="size-6" />
          </Button>
        </div>

        <div className="absolute left-0 bottom-0 w-full px-8 rounded-b-full">
          <YeeSlider
            value={[player.progress]}
            onValueChange={player.seek}
            max={100}
            step={0.1}
            tooltip={formatTime(player.currentTime)}
            trackClassName="bg-muted"
            rangeClassName="bg-black"
          />
        </div>
      </div>
    </div>
  );
}
