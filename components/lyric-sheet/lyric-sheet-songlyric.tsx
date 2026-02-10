import { usePlayerStore } from "@/lib/store/playerStore";
import { cn } from "@/lib/utils";
import {
  LyricLine,
  LyricWord,
  ParseLyric,
  ParseVerbatimLyric,
} from "@/lib/utils/lyric-parser";
import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  MotionValue,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";

export function LyricSheetSongLyric({ className }: { className?: string }) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const currentSongLyrics = usePlayerStore((s) => s.currentSongLyrics);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [blurDisabled, setBlurDisabled] = useState(false);
  const isUserScrolling = useRef(false);
  const isProgrammticScroll = useRef(false);

  // 容器引用
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 存储每行歌词的 DOM 引用
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lyric = useMemo(() => {
    return (
      ParseVerbatimLyric(currentSongLyrics?.yrc?.lyric) ||
      ParseLyric(currentSongLyrics?.lrc?.lyric)
    );
  }, [currentSongLyrics]);

  // 歌曲变化时滚动到顶部
  useEffect(() => {
    if (!currentSong) return;

    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentSong]);

  const currentTimeMotion = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(
      (state) => state.currentTime,
      (currentTime) => {
        // 更新 MotionValue（不触发重渲染）
        currentTimeMotion.set(currentTime * 1000);
        // 计算 currentIndex
        if (!lyric?.length) return;
        const currentTimeMs = currentTime * 1000;
        let newIndex = -1;
        for (let i = lyric.length - 1; i >= 0; i--) {
          if (lyric[i].lineStart <= currentTimeMs && lyric[i].lineStart >= 0) {
            newIndex = i;
            break;
          }
        }
        // 只有 index 变化时才更新 state（触发重渲染）
        setCurrentIndex((prev) => (prev !== newIndex ? newIndex : prev));
      },
    );
    return unsubscribe;
  }, [lyric, currentTimeMotion]);

  const handleUserInteraction = () => {
    isUserScrolling.current = true;
    setBlurDisabled(true);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
      setBlurDisabled(false);
    }, 2000);
  };

  // 当歌词索引变化时，自动滚动到对应位置
  useEffect(() => {
    if (isUserScrolling.current) return;
    if (currentIndex < 0) return;
    if (!containerRef.current) return;

    const container = containerRef.current;
    const targetElement = lyricRefs.current[currentIndex];

    if (!targetElement) return;

    const containerHeight = container.clientHeight;
    const targetScrollTop =
      targetElement.offsetTop -
      containerHeight / 2 +
      targetElement.clientHeight / 2;

    isProgrammticScroll.current = true;

    const controls = animate(container.scrollTop, targetScrollTop, {
      type: "spring",
      stiffness: 100,
      damping: 20,
      mass: 1,
      onUpdate: (value) => {
        container.scrollTop = value;
      },
      onComplete: () => {
        isProgrammticScroll.current = false;
      },
    });

    return () => {
      controls.stop();
    };
  }, [currentIndex]);

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  return (
    <div
      className={cn(
        "h-full w-full flex justify-center overflow-y-auto no-scrollbar",
        className,
      )}
      ref={containerRef}
      onWheel={handleUserInteraction}
      onTouchStart={handleUserInteraction}
    >
      <div className="w-full flex flex-col items-start">
        {lyric?.map((lyricLine, idx) => (
          <SongLyricLine
            key={idx}
            ref={(el) => {
              lyricRefs.current[idx] = el;
            }}
            lyricLine={lyricLine}
            isActive={idx === currentIndex}
            blurDisabled={blurDisabled}
            currentTimeMotion={currentTimeMotion}
          />
        ))}
      </div>
    </div>
  );
}

import { forwardRef } from "react";
import React from "react";

export const SongLyricLine = forwardRef<
  HTMLDivElement,
  {
    lyricLine: LyricLine;
    isActive: boolean;
    blurDisabled: boolean;
    currentTimeMotion: MotionValue<number>;
  }
>(({ lyricLine, isActive, blurDisabled, currentTimeMotion }, ref) => {
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const shouldBlur = !blurDisabled && !isActive;

  function handleClick() {
    seek((lyricLine.lineStart / (duration * 1000)) * 100);
  }

  const hasWords = lyricLine.words && lyricLine.words.length > 0;

  const lineRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(currentTimeMotion, "change", (latest) => {
    if (!hasWords || !lineRef.current) return;

    lyricLine.words?.forEach((word, idx) => {
      let progress = 0;

      if (isActive) {
        if (latest < word.startTime) {
          progress = 0;
        } else if (latest >= word.startTime + word.duration) {
          progress = 1;
        } else {
          progress = (latest - word.startTime) / word.duration;
        }
      }

      lineRef.current?.style.setProperty(
        `--word-${idx}`,
        `${(1 - progress) * 100}%`,
      );

      const translateY = -2 * progress;
      lineRef.current?.style.setProperty(`--word-y-${idx}`, `${translateY}px`);
    });
  });

  if (!hasWords) {
    return (
      <div ref={ref}>
        <motion.div
          className="cursor-pointer hover:bg-white/5 px-4 py-4 rounded-xl inline-block"
          onClick={handleClick}
        >
          <motion.span
            initial={false}
            className={cn(
              "w-full text-3xl text-white/80 mix-blend-plus-lighter drop-shadow-md inline-block font-medium tracking-tight",
            )}
            animate={{
              filter: shouldBlur ? "blur(2px)" : "blur(0px)",
              opacity: isActive ? 0.8 : 0.2,
              y: isActive ? -4 : 0,
              willChange: "transform",
            }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            {lyricLine.lineText}
          </motion.span>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        lineRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
    >
      <motion.div
        className="cursor-pointer hover:bg-white/5 px-4 py-4 rounded-xl inline-block"
        onClick={handleClick}
        style={{ "--current-ms": "0" } as CSSProperties}
      >
        <motion.span
          initial={false}
          className={cn(
            "w-full text-3xl text-white mix-blend-plus-lighter drop-shadow-md inline-block font-bold! tracking-tight",
          )}
          animate={{
            filter: shouldBlur ? "blur(2px)" : "blur(0px)",
            opacity: isActive ? 1 : 0.4,
          }}
          transition={{ type: "spring", duration: 0.8 }}
        >
          {lyricLine.words!.map((word, wordIdx) => (
            <VerbatimWord key={wordIdx} word={word} index={wordIdx} />
          ))}
        </motion.span>
      </motion.div>
    </div>
  );
});

SongLyricLine.displayName = "SongLyricLine";

const VerbatimWord = React.memo(function VerbatimWord({
  word,
  index,
}: {
  word: LyricWord;
  index: number;
}) {
  return (
    <span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        color: "transparent",
        backgroundImage: `linear-gradient(to left,
                          rgba(255,255,255,0.4) 0%,
                          rgba(255,255,255,0.4) calc(var(--word-${index}, 0%) - 10%), 
                          rgba(255,255,255,0.8) calc(var(--word-${index}, 0%) + 10%))`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        transform: `translateY(var(--word-y-${index}, 0px))`,
        transition: `transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)`,
        textShadow: `0 0 10px rgba(0, 0, 0, 0.1)`,
        willChange: "transform",
      }}
    >
      {word.char}
    </span>
  );
});
