import { usePlayerStore } from "@/lib/store/playerStore";
import { ILyricLine } from "@/lib/utils/lyric-parser";
import { MotionValue, motion } from "framer-motion";
import { forwardRef } from "react";
import { VerbatimWord } from "./verbatim-word";

export const LyricLine = forwardRef<
  HTMLDivElement,
  {
    lyricLine: ILyricLine;
    transLine?: ILyricLine;
    romaLine?: ILyricLine;
    showTrans: boolean;
    showRoma: boolean;
    currentTimeMotion: MotionValue<number>;
    scrollDelay: number;
    isActive: boolean;
    opacity: number;
    blur: number;
    targetScrollY: number;
    isScrolling: boolean;
    isLargeJump: boolean;
    isLayoutChanging?: boolean;
    inWindow: boolean;
  }
>(
  (
    {
      lyricLine,
      transLine,
      romaLine,
      showTrans,
      showRoma,
      currentTimeMotion,
      scrollDelay,
      isActive,
      opacity,
      blur,
      targetScrollY,
      isScrolling,
      isLargeJump,
      isLayoutChanging,
      inWindow,
    },
    ref,
  ) => {
    const duration = usePlayerStore((s) => s.duration);
    const seek = usePlayerStore((s) => s.seek);

    function handleClick() {
      seek((lyricLine.lineStart / (duration * 1000)) * 100);
    }

    const hasWords = lyricLine.words && lyricLine.words.length > 0;

    const lineText = hasWords
      ? lyricLine.words!.map((w) => w.char).join("")
      : lyricLine.lineText;

    const yTransition = isLayoutChanging
      ? {
          type: "spring" as const,
          stiffness: 120,
          damping: 20,
          mass: 0.8,
          delay: 0,
        }
      : isScrolling
        ? { type: "tween" as const, duration: 0, ease: "linear" as const }
        : isLargeJump
          ? {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.5,
              delay: 0,
            }
          : {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.8,
              delay: scrollDelay,
            };

    const layoutTransition = isLayoutChanging
      ? {
          type: "spring" as const,
          stiffness: 170,
          damping: 26,
          mass: 0.8,
          delay: 0,
        }
      : isScrolling
        ? { type: "tween" as const, duration: 0, ease: "linear" as const }
        : isLargeJump
          ? {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.5,
              delay: 0,
            }
          : {
              type: "spring" as const,
              stiffness: 120,
              damping: 20,
              mass: 0.8,
              delay: scrollDelay,
            };

    const subStyle: React.CSSProperties = {
      color: "rgba(255, 255, 255, 0.4)",
      filter: `blur(${blur}px)`,
    };

    if (!inWindow) {
      return (
        <div
          ref={ref}
          className="px-4 py-4 rounded-xl inline-block pointer-events-none"
          style={{ transform: `translateY(${targetScrollY}px)`, opacity: 0 }}
        >
          <span className="w-full text-3xl text-white inline-block font-medium tracking-tight">
            {lineText}
          </span>
          {showTrans && transLine && (
            <span className="w-full text-2xl inline-block font-medium tracking-tight mt-4">
              {transLine.lineText}
            </span>
          )}
          {showRoma && romaLine && (
            <span className="w-full text-2xl inline-block font-medium tracking-tight mt-4">
              {romaLine.lineText}
            </span>
          )}
        </div>
      );
    }

    if (!isActive) {
      return (
        <motion.div
          layout
          ref={ref}
          animate={{ y: targetScrollY }}
          transition={{ layout: layoutTransition, y: yTransition }}
        >
          <motion.div
            className="cursor-pointer hover:bg-white/5 px-4 py-4 rounded-xl inline-block transition-colors duration-300"
            onClick={handleClick}
          >
            <motion.span
              initial={false}
              className="w-full text-3xl text-white/60 inline-block font-medium tracking-tight"
              animate={{
                filter: `blur(${blur}px)`,
                opacity,
              }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {lineText}
            </motion.span>
            {showTrans && transLine && (
              <motion.span
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="w-full text-2xl inline-block font-medium tracking-tight mt-4"
                style={subStyle}
              >
                {transLine.lineText}
              </motion.span>
            )}
            {showRoma && romaLine && (
              <motion.span
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="w-full text-2xl inline-block font-medium tracking-tight mt-4"
                style={subStyle}
              >
                {romaLine.lineText}
              </motion.span>
            )}
          </motion.div>
        </motion.div>
      );
    }

    return (
      <motion.div
        layout
        ref={ref}
        animate={{ y: targetScrollY }}
        transition={{ layout: layoutTransition, y: yTransition }}
      >
        <motion.div
          className="cursor-pointer hover:bg-white/5 px-4 py-4 rounded-xl inline-block transition-colors duration-300"
          onClick={handleClick}
        >
          <motion.span
            initial={false}
            className="w-full text-3xl text-white/60 mix-blend-plus-lighter inline-block font-medium tracking-tight"
            animate={{
              filter: `blur(${blur}px)`,
              opacity,
              transformOrigin: "left center",
              willChange: "transform",
              y: !hasWords ? -4 : 0,
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            {hasWords
              ? lyricLine.words!.map((word, wordIdx) => (
                  <VerbatimWord
                    key={wordIdx}
                    word={word}
                    currentTimeMotion={currentTimeMotion}
                  />
                ))
              : lyricLine.lineText}
          </motion.span>

          {showTrans && transLine && (
            <motion.span
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="w-full text-2xl mix-blend-plus-lighter inline-block font-medium tracking-tight mt-4"
              style={subStyle}
            >
              {transLine.lineText}
            </motion.span>
          )}

          {showRoma && romaLine && (
            <motion.span
              layout="position"
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="w-full text-2xl mix-blend-plus-lighter inline-block font-medium tracking-tight mt-4"
              style={subStyle}
            >
              {romaLine.lineText}
            </motion.span>
          )}
        </motion.div>
      </motion.div>
    );
  },
);

LyricLine.displayName = "LyricLine";
