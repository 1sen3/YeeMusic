"use client";

import { Button } from "./ui/button";
import Image from "next/image";
import { Badge } from "./ui/badge";
import {
  ArrowRepeat124Regular,
  ArrowShuffle24Regular,
  CommentQuote24Regular,
  MoreHorizontal24Filled,
  NavigationPlay20Regular,
  Next24Filled,
  Pause24Filled,
  Previous24Filled,
  Speaker024Filled,
  Speaker124Filled,
  Speaker124Regular,
  Speaker224Filled,
  Speaker224Regular,
  TextBulletList24Regular,
} from "@fluentui/react-icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { MyTooltip } from "./my-tooltip";
import { Slider } from "./ui/slider";
import { SONG_QUALITY, SONG_QUALITY_STYLES } from "@/lib/constants/song";

export function PlayerBar() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-5/6 h-20 border-white bg-background/90 backdrop-blur z-50 rounded-full shadow-lg">
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center justify-start gap-1 shrink-0">
          <MyTooltip tooltip="随机">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <ArrowShuffle24Regular className="size-5" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="上一首">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <Previous24Filled className="size-6" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="暂停">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <Pause24Filled className="size-6" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="下一首">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <Next24Filled className="size-6" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="单曲循环">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <ArrowRepeat124Regular className="size-5" />
            </Button>
          </MyTooltip>
        </div>

        <div className="w-32 flex items-center justify-start gap-3 min-w-0 ml-4">
          <Image
            src="/album.jpg"
            alt="Album cover"
            width={38}
            height={38}
            className="rounded-md"
          />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-sm line-clamp-1">美妙生活</span>
            <span className=" font-medium text-sm text-gray-600 ">林宥嘉</span>
          </div>
        </div>

        <div className="flex-1 w-full mx-4">
          <MyTooltip tooltip="50%">
            <Slider defaultValue={[50]} max={100} step={1} className="" />
          </MyTooltip>
        </div>

        <div className="flex items-center justify-end gap-1 shrink-0">
          <MyTooltip tooltip={SONG_QUALITY.hires}>
            <Badge className={`${SONG_QUALITY_STYLES.hires} cursor-pointer`}>
              {SONG_QUALITY.hires}
            </Badge>
          </MyTooltip>
          <MyTooltip tooltip="歌词">
            <Button
              variant="ghost"
              size="icon"
              className="size-12  cursor-pointer"
            >
              <CommentQuote24Regular className="size-6" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="播放列表">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <NavigationPlay20Regular className="size-6" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="音量">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <Speaker224Regular className="size-6" />
            </Button>
          </MyTooltip>
          <MyTooltip tooltip="更多">
            <Button
              variant="ghost"
              size="icon"
              className="size-12 cursor-pointer"
            >
              <MoreHorizontal24Filled className="size-6" />
            </Button>
          </MyTooltip>
        </div>
      </div>
    </div>
  );
}
