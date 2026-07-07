import { useAppWindow } from "@/hooks/use-app-window";
import { YeeButton } from "../yee-button";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Dismiss24Filled,
  Maximize24Regular,
  SquareMultiple24Regular,
  Subtract24Filled,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import {
  sfArrowDownBackwardAndArrowUpForwardSquareFill,
  sfArrowDownForwardAndArrowUpBackwardSquareFill,
} from "@bradleyhodges/sfsymbols";
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
    <SFIcon icon={sfArrowDownForwardAndArrowUpBackwardSquareFill} />
  ) : (
    <SFIcon icon={sfArrowDownBackwardAndArrowUpForwardSquareFill} />
  );
  const lastClickTimeRef = useRef(0);
  const MaxmizeIcon = isMaximized ? SquareMultiple24Regular : Maximize24Regular;
  const [isHovered, setIsHovered] = useState(false);
  const handleToggleMaximize = async () => {
    if (isFullscreen) {
      await toggleFullscreen();
      return;
    }

    await toogleMaximize();
  };

  return (
    <div
      className="w-screen h-16 grid grid-cols-[1fr_auto_1fr] items-center overflow-hidden px-4 absolute top-0 left-0 z-10000"
      onMouseDown={(e) => {
        if (e.button !== 0 || isFullscreen) return;
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="w-full flex justify-center py-4 group col-end-3"
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
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <YeeButton
                variant="ghost"
                icon={fullScreenIcon}
                onClick={toggleFullscreen}
                className="text-white size-8 hover:bg-white/10 hover:text-white rounded-lg"
                onMouseDown={(e) => e.stopPropagation()}
              />
              <div
                className={cn(
                  "flex items-center transition-all duration-300 ease-in-out gap-2",
                )}
              >
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
                  onClick={handleToggleMaximize}
                />
                <YeeButton
                  variant="ghost"
                  icon={<Dismiss24Filled />}
                  className="text-white size-8 hover:bg-white/10 hover:text-white rounded-lg"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={close}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
