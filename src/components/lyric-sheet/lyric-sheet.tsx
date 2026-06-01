import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useState } from "react";
import { LyricSheetSonglist } from "./lyric-sheet-songlist";
import { motion, AnimatePresence } from "framer-motion";
import { LyricSheetSonginfo } from "./lyric-sheet-songinfo";
import { useHotkeys } from "react-hotkeys-hook";
import { LyricSheetBackground } from "./lyric-sheet-background";
import { LyricSheetTitlebar } from "./lyric-sheetr-titlebar";
import { cn } from "@/lib/utils";
import { Lyric } from "../lyric/lyric";

export function LyricSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isLyricOpen, setIsLyricOpen] = useState(false);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const [showTrans, setShowTrans] = useState(false);
  const [showRoma, setShowRoma] = useState(false);

  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      togglePlay();
    },
    { enableOnFormTags: false },
    [togglePlay],
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className={cn(
          "w-screen h-screen! p-0 border-none sm:max-h-none overflow-hidden",
        )}
        showCloseButton={false}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <SheetHeader className="hidden">
          <SheetTitle></SheetTitle>
        </SheetHeader>

        <LyricSheetBackground />

        <div
          className="relative h-full w-full flex flex-col"
          onMouseDown={(e) => {
            e.preventDefault();
          }}
        >
          <LyricSheetTitlebar setIsOpen={setIsOpen} />

          <div className="h-full w-full flex justify-between ">
            <motion.div
              layout
              initial={false}
              animate={{
                x: isPlaylistOpen || isLyricOpen ? "-5%" : "0%",
                width: isPlaylistOpen || isLyricOpen ? "50%" : "100%",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="will-change-transform relative h-full text-white flex flex-col items-center justify-center shrink-0"
            >
              <LyricSheetSonginfo
                setIsOpen={setIsOpen}
                isPlaylistOpen={isPlaylistOpen}
                onPlaylistOpenChangeAction={setIsPlaylistOpen}
                isLyricOpen={isLyricOpen}
                onLyricOpenChangeAction={setIsLyricOpen}
              />
            </motion.div>
            <AnimatePresence>
              {isPlaylistOpen && (
                <motion.div
                  initial={{ clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
                  exit={{ clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-24 top-24 bottom-12 w-[calc(50%-48px)] z-10"
                  style={{ willChange: "clip-path, opacity" }}
                >
                  <LyricSheetSonglist
                    className="flex w-full h-full"
                    setOpen={setIsOpen}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isLyricOpen && (
                <motion.div
                  initial={{ clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
                  animate={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
                  exit={{ clipPath: "inset(0% 0% 100% 0%)", opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute right-12 top-24 bottom-12 w-[calc(50%-48px)] z-10"
                  style={{ willChange: "clip-path, opacity" }}
                >
                  <Lyric
                    className="flex w-full h-full"
                    showTrans={showTrans}
                    setShowTrans={setShowTrans}
                    showRoma={showRoma}
                    setShowRoma={setShowRoma}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
