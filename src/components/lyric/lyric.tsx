import { usePlayerStore } from "@/lib/store/playerStore";
import { cn } from "@/lib/utils";
import {
  ILyricLine,
  ParseLyric,
  ParseVerbatimLyric,
} from "@/lib/utils/lyric-parser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { motion, useMotionValue } from "framer-motion";
import React from "react";
import { YeeButton } from "../yee-button";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { sfTranslate, sfCharacterPhonetic } from "@bradleyhodges/sfsymbols";
import { LyricLine } from "./lyric-line";

const LYRIC_CROLL_DELAY = 0.04;

const MASK_IMAGE =
  "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)";

export function Lyric({ className }: { className?: string }) {
  const [showTrans, setShowTrans] = useState(false);
  const [showRoma, setShowRoma] = useState(false);

  const [currentScrollY, setCurrentScrollY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isLargeJump, setIsLargeJump] = useState(false);
  const [isLayoutChanging, setIsLayoutChanging] = useState(false);

  const currentSong = usePlayerStore((s) => s.currentSong);
  const currentSongLyrics = usePlayerStore((s) => s.currentSongLyrics);
  const targetScrollYRef = useRef(0);

  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [blurDisabled, setBlurDisabled] = useState(false);
  const isUserScrolling = useRef(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lyric = useMemo(() => {
    return (
      ParseVerbatimLyric(currentSongLyrics?.yrc?.lyric) ||
      ParseLyric(currentSongLyrics?.lrc?.lyric)
    );
  }, [currentSongLyrics]);

  const transLyric = useMemo(() => {
    return (
      ParseLyric(currentSongLyrics?.ytlrc?.lyric) ||
      ParseLyric(currentSongLyrics?.tlyric?.lyric) ||
      []
    );
  }, [currentSongLyrics]);

  const romaLyric = useMemo(() => {
    return (
      ParseLyric(currentSongLyrics?.yromalrc?.lyric) ||
      ParseLyric(currentSongLyrics?.romalrc?.lyric) ||
      []
    );
  }, [currentSongLyrics]);

  const transMap = useMemo(() => {
    const map = new Map<number, ILyricLine>();
    transLyric?.forEach((t) => map.set(t.lineStart, t));
    return map;
  }, [transLyric]);

  const romaMap = useMemo(() => {
    const map = new Map<number, ILyricLine>();
    romaLyric?.forEach((r) => map.set(r.lineStart, r));
    return map;
  }, [romaLyric]);

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
        currentTimeMotion.set(currentTime * 1000);

        if (!lyric?.length) return;
        const currentTimeMs = currentTime * 1000;
        let newIndex = -1;
        for (let i = lyric.length - 1; i >= 0; i--) {
          if (lyric[i].lineStart <= currentTimeMs && lyric[i].lineStart >= 0) {
            newIndex = i;
            break;
          }
        }
        setCurrentIndex((prev) => (prev !== newIndex ? newIndex : prev));
      },
    );
    return unsubscribe;
  }, [lyric, currentTimeMotion]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isLargeJump) {
      const timer = setTimeout(() => {
        setIsLargeJump(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLargeJump]);

  const scrollToCurrentIndex = useCallback(
    (skipAnimation = false) => {
      if (currentIndex < 0 || !containerRef.current) return;

      const targetElement = lyricRefs.current[currentIndex];
      if (!targetElement) return;

      const containerHeight = containerRef.current.clientHeight;
      const offset =
        targetElement.offsetTop -
        containerHeight / 2 +
        targetElement.clientHeight / 2;

      const newTargetScrollY = -offset;

      if (skipAnimation) {
        targetScrollYRef.current = newTargetScrollY;
        setCurrentScrollY(newTargetScrollY);
        return;
      }

      const jumpDistancePx = Math.abs(
        targetScrollYRef.current - newTargetScrollY,
      );
      if (jumpDistancePx > 150) {
        setIsLargeJump(true);
      }

      targetScrollYRef.current = newTargetScrollY;
      setCurrentScrollY(newTargetScrollY);
    },
    [currentIndex],
  );

  useEffect(() => {
    // 手动滚动时不跳回
    if (isUserScrolling.current) return;
    scrollToCurrentIndex();
  }, [currentIndex, scrollToCurrentIndex]);

  useEffect(() => {
    if (!isScrolling && !isUserScrolling.current) {
      scrollToCurrentIndex();
    }
  }, [isScrolling, scrollToCurrentIndex]);

  const handleUserInteraction = () => {
    isUserScrolling.current = true;
    setBlurDisabled(true);
    setIsScrolling(true);

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrolling.current = false;
      setBlurDisabled(false);
      setIsScrolling(false);
    }, 2000);
  };

  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    handleUserInteraction();

    if (!containerRef.current) return;

    const delta = e.deltaY;
    targetScrollYRef.current -= delta;

    const containerHeight = containerRef.current.clientHeight;
    const firstElement = lyricRefs.current[0];
    const lastElement = lyricRefs.current[lyricRefs.current.length - 1];

    if (firstElement && lastElement) {
      const maxScroll = -(
        firstElement.offsetTop -
        containerHeight / 2 +
        firstElement.clientHeight / 2
      );
      const minScroll = -(
        lastElement.offsetTop -
        containerHeight / 2 +
        lastElement.clientHeight / 2
      );

      targetScrollYRef.current = Math.max(
        minScroll,
        Math.min(maxScroll, targetScrollYRef.current),
      );
    }
    setCurrentScrollY(targetScrollYRef.current);
  }

  const visualIndex = useMemo(() => {
    if (!containerRef.current || lyricRefs.current.length === 0)
      return Math.max(0, currentIndex);
    const targetOffset = -currentScrollY;
    const containerHeight = containerRef.current.clientHeight;

    let minDiff = Infinity;
    let bestIndex = Math.max(0, currentIndex);
    for (let i = 0; i < lyricRefs.current.length; i++) {
      const el = lyricRefs.current[i];
      if (el) {
        const offset = el.offsetTop - containerHeight / 2 + el.clientHeight / 2;
        const diff = Math.abs(offset - targetOffset);
        if (diff < minDiff) {
          minDiff = diff;
          bestIndex = i;
        }
      }
    }
    return bestIndex;
  }, [currentScrollY, currentIndex]);

  return (
    <div className={cn("h-full w-full relative", className)}>
      <div
        className={cn(
          "h-full w-full flex justify-center overflow-hidden relative",
          className,
        )}
        ref={containerRef}
        onWheel={handleWheel}
        onTouchStart={handleUserInteraction}
        style={{
          WebkitMaskImage: MASK_IMAGE,
        }}
      >
        <motion.div
          className="w-full flex flex-col items-start "
          style={{ fontFamily: "var(--app-lyric-font-family, inherit)" }}
        >
          {lyric?.map((lyricLine, idx) => {
            const inWindow =
              Math.abs(idx - visualIndex) <= 10 ||
              Math.abs(idx - currentIndex) <= 5;
            const distance = Math.abs(idx - currentIndex);
            const scrollDelay = distance * LYRIC_CROLL_DELAY;

            const isActive = idx === currentIndex;
            const shouldBlur = !blurDisabled && !isActive;

            const dynamicOpacity = isActive ? 1 : 0.4;
            const dynamicBlur = shouldBlur ? Math.min(6, distance * 1) : 0;

            return (
              <LyricLine
                key={idx}
                ref={(el) => {
                  lyricRefs.current[idx] = el;
                }}
                lyricLine={lyricLine}
                transLine={transMap.get(lyricLine.lineStart)}
                romaLine={romaMap.get(lyricLine.lineStart)}
                showTrans={showTrans}
                showRoma={showRoma}
                currentTimeMotion={currentTimeMotion}
                scrollDelay={scrollDelay}
                isActive={isActive}
                opacity={dynamicOpacity}
                blur={dynamicBlur}
                targetScrollY={currentScrollY}
                isScrolling={isScrolling}
                isLargeJump={isLargeJump}
                isLayoutChanging={isLayoutChanging}
                inWindow={inWindow}
              />
            );
          })}
          <div className="w-full h-[50vh] shrink-0 pointer-events-none" />
        </motion.div>
      </div>
      <div className="flex items-center gap-4 absolute bottom-2 right-2">
        {transLyric.length > 0 && (
          <YeeButton
            variant="ghost"
            icon={
              <SFIcon icon={sfTranslate} className="size-6 drop-shadow-md" />
            }
            className={cn(
              "size-10 text-white rounded-full hover:bg-white/5 hover:text-white mix-blend-plus-lighter",
              showTrans &&
                "bg-white/60 text-black/80 hover:bg-white/80 hover:text-black/60",
            )}
            onClick={() => {
              flushSync(() => {
                setIsLayoutChanging(true);
                setShowTrans((prev) => {
                  if (showRoma) setShowRoma(false);
                  return !prev;
                });
              });

              if (!isUserScrolling.current && containerRef.current) {
                const targetElement = lyricRefs.current[currentIndex];
                if (targetElement) {
                  const offset =
                    targetElement.offsetTop -
                    containerRef.current.clientHeight / 2 +
                    targetElement.clientHeight / 2;
                  flushSync(() => {
                    targetScrollYRef.current = -offset;
                    setCurrentScrollY(-offset);
                  });
                }
              }
              setTimeout(() => setIsLayoutChanging(false), 50);
            }}
          />
        )}
        {romaLyric.length > 0 && (
          <YeeButton
            variant="ghost"
            icon={
              <SFIcon
                icon={sfCharacterPhonetic}
                className="size-5 drop-shadow-md"
              />
            }
            className={cn(
              "size-10 text-white rounded-full hover:bg-white/5 hover:text-white mix-blend-plus-lighter",
              showRoma &&
                "bg-white/60 text-black/80 hover:bg-white/80 hover:text-black/60",
            )}
            onClick={() => {
              flushSync(() => {
                setIsLayoutChanging(true);
                setShowRoma((prev) => {
                  if (showTrans) setShowTrans(false);
                  return !prev;
                });
              });

              if (!isUserScrolling.current && containerRef.current) {
                const targetElement = lyricRefs.current[currentIndex];
                if (targetElement) {
                  const offset =
                    targetElement.offsetTop -
                    containerRef.current.clientHeight / 2 +
                    targetElement.clientHeight / 2;
                  flushSync(() => {
                    targetScrollYRef.current = -offset;
                    setCurrentScrollY(-offset);
                  });
                }
              }
              setTimeout(() => setIsLayoutChanging(false), 50);
            }}
          />
        )}
      </div>
    </div>
  );
}
