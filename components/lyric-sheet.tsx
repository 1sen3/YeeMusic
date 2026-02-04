import styles from "./lyric-sheet.module.css";
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
import { Button } from "./ui/button";
import { ChevronDown24Filled } from "@fluentui/react-icons";
import { cn } from "@/lib/utils";
import { LyricSheetSonglist } from "./lyric-sheet-songlist";
import { motion, AnimatePresence } from "framer-motion";
import { LyricSheetSonginfo } from "./lyric-sheet-songinfo";
import { LyricSheetSongLyric } from "./lyric-sheet-songlyric";

export function LyricSheet({ children }: { children: React.ReactNode }) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);

  const [gradientColors, setGradientColors] = useState<string[]>([
    "#1a1a2e",
    "#16213e",
    "#0f3460",
    "#1a1a2e",
  ]);

  const coverUrl = currentSong?.al?.picUrl;
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isLyricOpen, setIsLyricOpen] = useState(false);

  useEffect(() => {
    if (!coverUrl) return;

    const v = new Vibrant(coverUrl);
    v.getPalette()
      .then((palette) => {
        // 取主色
        const mainColor =
          palette.Muted?.hex ||
          palette.DarkMuted?.hex ||
          palette.DarkVibrant?.hex ||
          palette.Vibrant?.hex ||
          "#1a1a2e";

        const muted = palette.Muted?.hex;
        const darkMuted = palette.DarkMuted?.hex;
        const darkVibrant = palette.DarkVibrant?.hex;
        const vibrant = palette.Vibrant?.hex;

        const base = chroma(mainColor);
        const [h, s] = base.hsl();

        // 生成同色系的深浅渐变
        const palette4 = [
          chroma.hsl(h, Math.min(s, 0.35), 0.12).hex(),
          chroma.hsl(h, Math.min(s, 0.3), 0.18).hex(),
          chroma.hsl(h, Math.min(s, 0.25), 0.25).hex(),
          chroma.hsl(h, Math.min(s, 0.2), 0.32).hex(),
        ];

        setGradientColors([
          muted || "",
          darkMuted || "",
          darkVibrant || "",
          vibrant || "",
        ]);
      })
      .catch((e: unknown) => console.log(e));
  }, [coverUrl]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="w-screen h-full! p-0 border-none sm:max-h-none overflow-hidden"
        showCloseButton={false}
      >
        <SheetHeader className="hidden">
          <SheetTitle></SheetTitle>
        </SheetHeader>

        <div className="absolute inset-0">
          <MeshGradient
            colors={gradientColors}
            distortion={1}
            swirl={0.3}
            speed={isPlaying ? 0.4 : 0}
            grainMixer={0.2}
            grainOverlay={0.1}
            className="w-full h-full"
          />
        </div>

        <div className="relative h-full w-full flex justify-between py-24 px-24">
          <motion.div
            layout
            initial={false}
            animate={{
              x: isPlaylistOpen || isLyricOpen ? "-10%" : "0%",
              width: isPlaylistOpen || isLyricOpen ? "50%" : "100%",
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="will-change-transform relative h-full text-white flex flex-col items-center justify-center shrink-0"
          >
            <LyricSheetSonginfo
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
                className="absolute right-24 top-24 bottom-24 w-[calc(50%-48px)] z-10"
                style={{ willChange: "clip-path, opacity" }}
              >
                <LyricSheetSonglist className="flex w-full h-full" />
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
                className="absolute right-24 top-24 bottom-24 w-[calc(50%-48px)] z-10"
                style={{ willChange: "clip-path, opacity" }}
              >
                <LyricSheetSongLyric className="flex w-full h-full" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute top-4 right-4">
            <Button
              onClick={() => setIsOpen(false)}
              className="cursor-pointer hover:bg-black/10"
              variant="ghost"
            >
              <ChevronDown24Filled className="size-5 text-white" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
