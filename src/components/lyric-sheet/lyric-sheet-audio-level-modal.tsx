import { QUALITY_BY_KEY, type QualityKey } from "@/lib/constants/song";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { cn, formatFileSize } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MusicLevelPopover } from "../music-level-popover";
import {
  Dialog,
  DialogAction,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function LyricSheetAudioLevelModel({
  setIsLyricSheetOpen,
}: {
  setIsLyricSheetOpen: (isOpen: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentMusicLevelKey = usePlayerStore((s) => s.currentMusicLevelKey);
  const currentSongMusicDetail = usePlayerStore(
    (s) => s.currentSongMusicDetail,
  );
  const navigate = useNavigate();
  const shouldShowQualityText = currentMusicLevelKey !== "db";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            "inline-flex items-center gap-1.5 rounded-sm border-0 px-2 py-1 font-semibold text-xs text-white/40 transition-colors duration-300 ease-out select-none mix-overlay backdrop-blur-md bg-white/5 hover:bg-white/10",
            !shouldShowQualityText && "px-2.5",
          )}
        >
          <QualityTriggerIcon qualityKey={currentMusicLevelKey} />
          {shouldShowQualityText && QUALITY_BY_KEY[currentMusicLevelKey].desc}
        </div>
      </DialogTrigger>
      <DialogContent className="border-0 bg-card/60 backdrop-blur-md yee-drop-shadow">
        <DialogTitle className="sr-only">音频质量</DialogTitle>
        <DialogBody>
          <div className="flex flex-col justify-start gap-4 px-4 pt-8">
            <MusicLevelPopover
              side="bottom"
              sideOffset={16}
              variant="dark"
              open={isOpen}
              onOpenChange={setIsOpen}
            >
              <div className="-mx-4 -mt-4 flex items-center justify-between rounded-md p-4 hover:bg-foreground/10">
                <span className="font-semibold text-lg">
                  {QUALITY_BY_KEY[currentMusicLevelKey].desc}
                </span>
                <ChevronDown
                  className={cn(
                    isOpen && "rotate-180",
                    "transition-transform duration-300 ease-in-out",
                  )}
                />
              </div>
            </MusicLevelPopover>
            <p className="text-foreground/60 text-sm">
              {currentMusicLevelKey === "local" ||
              currentMusicLevelKey === "unlock" ? (
                <span>不支持修改音质</span>
              ) : (
                formatFileSize(
                  currentSongMusicDetail.find(
                    (d) => d.key === currentMusicLevelKey,
                  )?.size ?? 0,
                )
              )}
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogAction
            className="bg-card text-foreground hover:bg-card/80"
            onClick={() => {
              navigate("/setting");
              setIsLyricSheetOpen(false);
            }}
          >
            详细设置
          </DialogAction>
          <DialogCancel className="border-none bg-primary text-white hover:bg-primary/80">
            好
          </DialogCancel>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QualityTriggerIcon({ qualityKey }: { qualityKey: QualityKey }) {
  if (qualityKey === "sq") {
    return <LosslessLogo className="h-3.5 w-[1.45rem] shrink-0" />;
  }
  if (qualityKey === "db") {
    return <DolbyLogo className="h-3.5 w-[3.4rem] shrink-0" />;
  }
  return null;
}

function LosslessLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 15 9"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M8.184,0.35C9.944,0.35 10.703,3.296 11.338,5.238C11.673,3.842 11.497,3.542 11.857,3.542C11.99,3.542 12.126,3.633 12.126,3.798C12.126,3.809 12.123,3.839 12.117,3.883L12.091,4.058C12.02,4.522 11.845,5.494 11.654,6.144C13.198,10.191 14.345,4.861 14.474,3.772C14.493,3.615 14.612,3.542 14.731,3.542C14.891,3.542 15.022,3.662 14.997,3.843C14.72,5.605 14.295,8.35 12.547,8.35C11.582,8.35 11.04,7.595 10.611,6.73C9.54,4.626 9.047,1.093 7.997,1.093C7.66,1.093 7.411,1.444 7.394,1.444C7.362,1.444 7.337,1.301 7.023,0.909C7.322,0.567 7.734,0.35 8.184,0.35ZM2.458,0.354C5.211,0.354 5.456,7.618 7.014,7.618C7.197,7.618 7.394,7.507 7.61,7.256C7.729,7.458 7.851,7.638 7.978,7.796C7.667,8.151 7.28,8.35 6.795,8.35C5.054,8.349 4.306,5.434 3.663,3.466C3.511,4.097 3.432,4.669 3.402,4.925C3.382,5.088 3.263,5.163 3.143,5.163C3.009,5.163 2.874,5.071 2.874,4.908L2.874,4.908L2.877,4.87C2.966,4.223 3.146,3.243 3.347,2.56C3.079,1.858 2.745,1.091 2.252,1.091C1.257,1.091 0.687,3.591 0.527,4.925C0.508,5.088 0.388,5.163 0.268,5.163C0.135,5.163 0,5.071 0,4.908C0,4.896 0.001,4.883 0.002,4.87C0.283,2.836 0.808,0.354 2.458,0.354ZM5.315,0.35C5.809,0.35 6.339,0.608 6.797,1.211C6.822,1.241 7.078,1.639 7.159,1.777C8.277,3.802 8.818,7.627 9.881,7.627C10.065,7.627 10.264,7.513 10.484,7.256C10.604,7.458 10.726,7.638 10.852,7.796C10.542,8.15 10.155,8.35 9.67,8.35C6.933,8.349 6.636,1.09 5.128,1.09C4.788,1.09 4.536,1.444 4.519,1.444C4.487,1.444 4.462,1.301 4.148,0.909C4.455,0.558 4.87,0.35 5.315,0.35Z"
      />
    </svg>
  );
}

function DolbyLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 61.875 15.97181373643878"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M0 12.012h1.772a6.017 6.017 0 0 0 6.006-6.006A6.016 6.016 0 0 0 1.772 0H0zM17.087 0h-1.772a6.017 6.017 0 0 0-6.007 6.006c0 3.308 2.698 6.006 6.007 6.006h1.772zm13.982 6.006a6.013 6.013 0 0 1-6.006 6.006h-4.339V0h4.339a6.012 6.012 0 0 1 6.006 6.006m-1.821 0a4.192 4.192 0 0 0-4.185-4.185h-2.517v8.37h2.517a4.192 4.192 0 0 0 4.185-4.185m11.07 1.844a4.166 4.166 0 0 1-4.162 4.162 4.166 4.166 0 0 1-4.163-4.162 4.167 4.167 0 0 1 4.163-4.162 4.167 4.167 0 0 1 4.162 4.162m-1.653-.004c0-1.377-1.132-2.509-2.509-2.509a2.51 2.51 0 0 0 0 5.019 2.511 2.511 0 0 0 2.509-2.51m2.831 4.179h1.821V.001h-1.821zM53.215 7.86a4.168 4.168 0 0 1-4.163 4.163 4.14 4.14 0 0 1-2.38-.751v.752h-1.825V0h1.825v4.448a4.14 4.14 0 0 1 2.38-.751 4.168 4.168 0 0 1 4.163 4.163m-1.654-.015a2.52 2.52 0 0 0-2.509-2.51 2.512 2.512 0 0 0-2.38 3.3 2.511 2.511 0 0 0 2.38 1.72 2.511 2.511 0 0 0 2.509-2.51m8.325-4.135l-2.372 5.334-2.373-5.334h-1.989l3.368 7.568-.826 1.859a.974.974 0 0 1-1.283.492l-.261-.116-.735 1.649.003.002.631.281a2.359 2.359 0 0 0 3.11-1.196L61.875 3.71z"
      />
    </svg>
  );
}
