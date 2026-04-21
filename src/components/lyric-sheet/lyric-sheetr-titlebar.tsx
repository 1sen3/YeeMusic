import { useAppWindow } from "@/hooks/use-app-window";
import { YeeButton } from "../yee-button";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Dismiss24Filled,
  FullScreenMaximize24Filled,
  FullScreenMinimize24Filled,
  Maximize24Regular,
  SquareMultiple24Regular,
  Subtract24Filled,
} from "@fluentui/react-icons";

export function LyricSheetTitlebar({
  setIsOpen,
}: {
  setIsOpen: (open: boolean) => void;
}) {
  const {
    startDragging,
    isFullscreen,
    toggleFullscreen,
    toogleMaximize,
    close,
    isMaximized,
    minimize,
  } = useAppWindow();

  const fullScreenIcon = isFullscreen ? (
    <FullScreenMinimize24Filled />
  ) : (
    <FullScreenMaximize24Filled />
  );

  const lastClickTimeRef = useRef(0);
  const MaxmizeIcon = isMaximized ? SquareMultiple24Regular : Maximize24Regular;

  return (
    <div
      className="w-full h-16 grid grid-cols-[1fr_auto_1fr] items-center overflow-hidden px-4"
      onMouseDown={(e) => {
        if (e.button !== 0) return;

        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastClickTimeRef.current;
        if (timeDiff < 300) {
          toogleMaximize();
          lastClickTimeRef.current = 0;
        } else {
          lastClickTimeRef.current = currentTime;
          startDragging();
        }
      }}
    >
      <div></div>
      <div
        className="w-full flex justify-center py-4 cursor-pointer group"
        onClick={() => {
          if (isFullscreen) {
            toggleFullscreen();
          }
          setIsOpen(false);
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <svg
          viewBox="0 0 128 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "h-1.5",
            "w-32 group-hover:w-16",
            "opacity-40 group-hover:opacity-70",
            "transition-all duration-300 ease-in-out",
            "delay-300 group-hover:delay-0",
          )}
          style={{ overflow: "visible" }}
        >
          <path
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "[d:path('M0,12_L64,12_L128,12')] group-hover:[d:path('M0,0_L64,24_L128,0')]",
              "transition-all duration-300 ease-in-out",
              "delay-0 group-hover:delay-300",
            )}
          />
        </svg>
      </div>
      <div className="flex items-center justify-end gap-2">
        <YeeButton
          variant="ghost"
          icon={fullScreenIcon}
          onClick={toggleFullscreen}
          className="text-white size-8 hover:bg-white/10 hover:text-white rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
        />
        <YeeButton
          variant="ghost"
          icon={<Subtract24Filled />}
          className="text-white size-8 hover:bg-white/10 hover:text-white rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={minimize}
        />
        <YeeButton
          variant="ghost"
          icon={<MaxmizeIcon />}
          className="text-white size-8 hover:bg-white/10 hover:text-white rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={toogleMaximize}
        />
        <YeeButton
          variant="ghost"
          icon={<Dismiss24Filled />}
          className="text-white size-8 hover:bg-white/10 hover:text-white rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={close}
        />
      </div>
    </div>
  );
}
