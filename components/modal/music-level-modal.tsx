import { SONG_QUALITY } from "@/lib/constants/song";
import { usePlayerStore } from "@/lib/store/playerStore";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "../yee-dialog";
import { cn, formatFileSize } from "@/lib/utils";

import { MusicLevelPopover } from "../music-level-popover";
import { Settings24Regular } from "@fluentui/react-icons";
import { Button } from "../ui/button";
import { useState } from "react";

export function MusicLevelModal() {
  const [isOpen, setIsOpen] = useState(false);

  const { musicLevel, currentSongMusicDetail, setMusicLevel } =
    usePlayerStore();

  function handleSetMusicLevel(level: string) {
    if (level in SONG_QUALITY) {
      setMusicLevel(level as keyof typeof SONG_QUALITY);
    }
  }

  return (
    <YeeDialog
      variant="dark"
      title="音频质量"
      asForm={false}
      trigger={
        <div className="border-0 bg-white/10 text-white/80 rounded-sm drop-shadow-md hover:bg-white/20 font-medium px-2 py-1 text-xs cursor-pointer">
          {SONG_QUALITY[musicLevel].desc}
        </div>
      }
      footer={
        <div className="w-full flex gap-2">
          <YeeDialogPrimaryButton
            onClick={() => handleSetMusicLevel(musicLevel)}
            variant="dark"
          >
            详细设置
          </YeeDialogPrimaryButton>
          <YeeDialogCloseButton variant="dark">好</YeeDialogCloseButton>
        </div>
      }
    >
      <div className="flex flex-col gap-2 px-4 pt-6 justify-start">
        <div className="flex justify-between items-center">
          <span className="text-lg ">{SONG_QUALITY[musicLevel].desc}</span>
          <MusicLevelPopover
            side="right"
            sideOffset={40}
            variant="dark"
            open={isOpen}
            onOpenChange={setIsOpen}
          >
            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer rounded-full hover:bg-white/10 hover:text-white"
            >
              <Settings24Regular className={cn("size-5 cursor-pointer")} />
            </Button>
          </MusicLevelPopover>
        </div>
        <span className="text-lg text-white/60">
          {formatFileSize(
            currentSongMusicDetail.find((detail) => detail.key === musicLevel)
              ?.size || 0,
          )}
        </span>
      </div>
    </YeeDialog>
  );
}
