import { MeshGradient } from "@paper-design/shaders-react";
import { Vibrant } from "node-vibrant/browser";
import chroma from "chroma-js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "./ui/button";
import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal24Filled,
  Next24Filled,
  Pause24Filled,
  Play24Filled,
  Previous24Filled,
  Speaker024Filled,
  Speaker224Filled,
} from "@fluentui/react-icons";
import { PlayerDurationSlider } from "./player-duration-slider";
import { cn, formatTime } from "@/lib/utils";
import { MyTooltip } from "./my-tooltip";
import { REPEAT_MODE_CONFIG, SHUFFLE_CONFIG } from "@/lib/constants/player";
import { Spinner } from "./ui/spinner";
import { Slider } from "./ui/slider";
import { useUserStore } from "@/lib/store/userStore";
import { likeSong } from "@/lib/services/user";
import { toast } from "sonner";
import { MusicLevelPopover } from "./music-level-popover";

export function LyricSheet({ children }: { children: React.ReactNode }) {
  const player = usePlayerStore();
  const { currentSong } = usePlayerStore();
  const [gradientColors, setGradientColors] = useState<string[]>([
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#1a1a2e",
  ]);

  const coverUrl = currentSong?.al?.picUrl;

  const isPlaying = player.isPlaying;
  const PlayIcon = isPlaying ? Pause24Filled : Play24Filled;
  const playTip = isPlaying ? "暂停" : "播放";

  const repeatMode = player.repeatMode;
  const isShuffle = player.isShuffle ? "on" : "off";

  const repeatModeConfig = REPEAT_MODE_CONFIG[repeatMode];
  const shuffleConfig = SHUFFLE_CONFIG[isShuffle];

  const canShuffle = repeatModeConfig.canShuffle;

  const { likeListSet, toggleLike } = useUserStore();
  const isLike = likeListSet.has(currentSong?.id || 0);
  const LikeIcon = isLike ? Heart24Filled : Heart24Regular;

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

  useEffect(() => {
    if (!coverUrl) return;

    const v = new Vibrant(coverUrl);
    v.getPalette()
      .then((palette) => {
        // 只取一个最可靠的主色（优先 Muted，最稳定）
        const mainColor =
          palette.Muted?.hex ||
          palette.DarkMuted?.hex ||
          palette.DarkVibrant?.hex ||
          palette.Vibrant?.hex ||
          "#1a1a2e";

        const base = chroma(mainColor);
        const [h, s] = base.hsl();

        // 生成同色系的深浅渐变（只改变亮度）
        const palette4 = [
          chroma.hsl(h, Math.min(s, 0.35), 0.12).hex(),
          chroma.hsl(h, Math.min(s, 0.3), 0.18).hex(),
          chroma.hsl(h, Math.min(s, 0.25), 0.25).hex(),
          chroma.hsl(h, Math.min(s, 0.2), 0.32).hex(),
        ];

        setGradientColors(palette4);
      })
      .catch((e: unknown) => console.log(e));
  }, [coverUrl]);

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="w-screen h-full! p-0 border-none sm:max-h-none overflow-hidden"
        showCloseButton={false}
      >
        <SheetHeader className="hidden">
          <SheetTitle></SheetTitle>
        </SheetHeader>

        <div className="absolute inset-0 overflow-hidden">
          {coverUrl && (
            <div
              className="absolute inset-[-50px] bg-cover bg-center"
              style={{
                backgroundImage: `url(${coverUrl})`,
                filter: "blur(100px) saturate(1.2)",
                transform: "scale(1.5)",
              }}
            />
          )}

          <div className="absolute inset-0 bg-black/0" />

          <div className="absolute inset-0 opacity-60">
            <MeshGradient
              colors={gradientColors}
              distortion={0.5}
              swirl={0.4}
              speed={1}
              grainMixer={0.2}
              grainOverlay={0.1}
              className="w-full h-full"
            />
          </div>
        </div>
        {/* 歌曲信息 */}
        <div className="relative h-full w-full text-white flex flex-col items-center justify-center z-10">
          <div className="w-full h-3/4 flex flex-col items-center justify-between">
            <div className="w-64 h-64 relative rounded-md shadow-xl overflow-hidden">
              <Image src={currentSong?.al.picUrl || ""} alt="" fill />
            </div>
            <div className="flex flex-col gap-4 w-104">
              <div className="flex justify-between items-center">
                <div className="w-4/7 flex flex-col gap-0">
                  <span className="text-xl text-white opacity-90 font-semibold drop-shadow-md mix-blend-plus-lighter line-clamp-1">
                    {currentSong?.name}
                  </span>
                  <span className="text-xl text-white/60 font-light drop-shadow-md mix-blend-plus-lighter line-clamp-1">
                    {currentSong?.ar?.map((ar) => ar.name).join("、")}
                  </span>
                </div>
                <div className="flex gap-2">
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

              <div className="flex flex-col gap-4">
                <PlayerDurationSlider
                  value={[player.progress]}
                  onValueChange={(value) => player.seek(value[0])}
                  max={100}
                  step={0.1}
                  tooltip={formatTime(player.currentTime)}
                  trackClassName="bg-white/40 h-2! group-hover:scale-y-150 transition-all duration-200"
                  rangeClassName="bg-white/60 h-2! group-hover:scale-y-150 transition-all duration-200"
                  showThumb={false}
                />
                <div className="flex justify-between items-center ">
                  <span className="text-white/50 font-light drop-shadow-md">
                    {formatTime(player.currentTime)}
                  </span>

                  <MusicLevelPopover className="border-0 bg-white/20 text-white/80 rounded-sm drop-shadow-md hover:bg-white/10 font-medium" />

                  <span className="text-white/50 font-light drop-shadow-md">
                    {formatTime(player.duration)}
                  </span>
                </div>
              </div>

              <div className=" flex items-center justify-between shrink-0 my-4">
                <MyTooltip tooltip={shuffleConfig.desc}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
                      !player.isShuffle && "text-white/50",
                    )}
                    disabled={!canShuffle}
                    onClick={player.toggleShuffleMode}
                  >
                    <shuffleConfig.icon className="size-5 drop-shadow-md" />
                  </Button>
                </MyTooltip>
                <MyTooltip tooltip="上一首">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-12 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
                    onClick={player.prev}
                  >
                    <Previous24Filled className="size-8" />
                  </Button>
                </MyTooltip>
                <MyTooltip tooltip={playTip}>
                  {player.isLoadingMusic ? (
                    <div className="w-16 h-16 flex items-center justify-center">
                      <Spinner className="size-8 drop-shadow-2xl" />
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-16 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
                      onClick={() => player.togglePlay()}
                    >
                      <PlayIcon className="size-12 drop-shadow-2xl" />
                    </Button>
                  )}
                </MyTooltip>
                <MyTooltip tooltip="下一首">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-12 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out"
                    onClick={player.next}
                  >
                    <Next24Filled className="size-8 drop-shadow-2xl" />
                  </Button>
                </MyTooltip>
                <MyTooltip tooltip={repeatModeConfig.desc}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 cursor-pointer hover:bg-white/10 hover:text-white rounded-full transition-all duration-300 ease-in-out",
                      repeatMode === "order" && "text-white/50",
                    )}
                    onClick={player.toggleRepeatMode}
                  >
                    <repeatModeConfig.icon className="size-5 drop-shadow-md" />
                  </Button>
                </MyTooltip>
              </div>

              <div className="flex gap-2 justify-between">
                <Speaker024Filled className="size-5 text-white/70" />
                <PlayerDurationSlider
                  value={[player.volume]}
                  onValueChange={(value) => player.updateVolume(value[0])}
                  max={1}
                  step={0.01}
                  trackClassName="bg-white/40 h-2! group-hover:scale-y-150 transition-all duration-200  drop-shadow-md"
                  rangeClassName="bg-white/60 h-2! group-hover:scale-y-150 transition-all duration-200"
                  tooltip={`音量：${player.volume * 100}`}
                  showThumb={false}
                />
                <Speaker224Filled className="size-5 text-white/70 drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
