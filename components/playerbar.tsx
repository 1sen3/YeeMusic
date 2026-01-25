'use client'

import { ChevronLeft, ChevronRight, List, MoreHorizontal, Pause, Quote, Repeat, Shuffle } from "lucide-react";
import { Button } from "./ui/button";
import Image from "next/image";
import { ArrowRepeat124Regular, ArrowRepeatAll28Regular, ArrowShuffle24Regular, CommentQuote24Regular, MoreCircle24Regular, MoreHorizontal24Filled, MoreVertical24Filled, Next24Filled, Pause24Filled, Previous24Filled, TextBulletList24Regular } from "@fluentui/react-icons";

export function PlayerBar() {
  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-5/6 h-20 border-white bg-background/80 backdrop-blur z-50 rounded-full shadow-lg">
      <div className="flex items-center justify-between h-full px-8">
        <div className="flex items-center justify-start gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="size-12">
            <ArrowShuffle24Regular className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12">
            <Previous24Filled className="size-8" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12">
            <Pause24Filled className="size-8" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12">
            <Next24Filled className="size-8" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12">
            <ArrowRepeat124Regular className="size-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-start gap-3 min-w-0 mx-4">
          <Image src="/album.jpg" alt="Album cover" width={38} height={38} className="rounded-md" />
          <div className="flex flex-col gap-0.5">
            <span className="font-bold">美妙生活</span>
            <span className=" font-medium">林宥嘉</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="size-12">
            <MoreHorizontal24Filled className="size-6" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12">
            <CommentQuote24Regular className="size-6" />
          </Button>
          <Button variant="ghost" size="icon" className="size-12">
            <TextBulletList24Regular className="size-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
