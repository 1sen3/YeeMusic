import { motion, useMotionValue } from "framer-motion";
import type React from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { corePlayer } from "@/lib/player/corePlayer";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { cn } from "@/lib/utils";
import {
  type ILyricLine,
  ParseLyric,
  ParseVerbatimLyric,
} from "@/lib/utils/lyric-parser";
import { LyricLine } from "./lyric-line";

const LYRIC_CROLL_DELAY = 0.04;
const MASK_IMAGE =
  "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)";

interface LyricProps {
  className?: string;
  showTrans: boolean;
  showRoma: boolean;
}

export function Lyric({ className, showTrans, showRoma }: LyricProps) {
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
  const lyricDisplayModeRef = useRef({ showTrans, showRoma });

  const lyric = useMemo(() => {
    return (
      ParseVerbatimLyric(currentSongLyrics?.yrc?.lyric) ||
      ParseLyric(currentSongLyrics?.lrc?.lyric)
    );
  }, [currentSongLyrics]);
  const lyricLength = lyric?.length ?? 0;

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
    transLyric?.forEach((t) => {
      map.set(t.lineStart, t);
    });
    return map;
  }, [transLyric]);

  const romaMap = useMemo(() => {
    const map = new Map<number, ILyricLine>();
    romaLyric?.forEach((r) => {
      map.set(r.lineStart, r);
    });
    return map;
  }, [romaLyric]);

  const getScrollBounds = useCallback(() => {
    if (!containerRef.current || lyricLength === 0) {
      return { min: 0, max: 0 };
    }

    const firstElement = lyricRefs.current[0];
    const lastElement = lyricRefs.current[lyricLength - 1];
    if (!firstElement || !lastElement) {
      return { min: 0, max: 0 };
    }

    const containerHeight = containerRef.current.clientHeight;
    const firstCentered = -(
      firstElement.offsetTop -
      containerHeight / 2 +
      firstElement.clientHeight / 2
    );
    const lastCentered = -(
      lastElement.offsetTop -
      containerHeight / 2 +
      lastElement.clientHeight / 2
    );

    return {
      min: Math.min(firstCentered, lastCentered),
      max: Math.max(firstCentered, lastCentered),
    };
  }, [lyricLength]);

  const clampScrollY = useCallback(
    (scrollY: number) => {
      const { min, max } = getScrollBounds();
      // Whole-pixel rest positions: lines sitting on fractional offsets get
      // resampled blur, which the additive (plus-lighter) compositing then
      // amplifies into visible fringing around bright glyphs.
      return Math.round(Math.min(max, Math.max(min, scrollY)));
    },
    [getScrollBounds],
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = lyricRefs.current[index];
      if (!el || !containerRef.current) return;
      const containerHeight = containerRef.current.clientHeight;
      const offset = el.offsetTop - containerHeight / 2 + el.clientHeight / 2;
      const nextScrollY = clampScrollY(-offset);
      targetScrollYRef.current = nextScrollY;
      setCurrentScrollY(nextScrollY);
    },
    [clampScrollY],
  );

  const findCurrentIndex = useCallback((lyrics: ILyricLine[]) => {
    const currentTimeMs = usePlayerStore.getState().currentTime * 1000;
    let idx = -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (lyrics[i].lineStart <= currentTimeMs && lyrics[i].lineStart >= 0) {
        idx = i;
        break;
      }
    }
    return Math.max(0, idx);
  }, []);

  const currentTimeMotion = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(-1);

  useEffect(() => {
    lyricRefs.current.length = lyricLength;
  }, [lyricLength]);

  useEffect(() => {
    if (!currentSong) return;

    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    targetScrollYRef.current = 0;
    if (lyric?.length) {
      const idx = findCurrentIndex(lyric);
      setCurrentIndex(idx);
      requestAnimationFrame(() => scrollToIndex(idx));
    }
  }, [currentSong, scrollToIndex, lyric, findCurrentIndex]);

  useEffect(() => {
    if (!lyric?.length) return;
    const idx = findCurrentIndex(lyric);
    setCurrentIndex(idx);
    requestAnimationFrame(() => scrollToIndex(idx));
  }, [lyric, scrollToIndex, findCurrentIndex]);

  // 高频订阅：直接从 corePlayer 获取时间，绕过 Zustand
  useEffect(() => {
    const unsubscribe = corePlayer.subscribeTime((currentTime) => {
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
    });
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
      const el = lyricRefs.current[currentIndex];
      if (!el) return;

      if (skipAnimation) {
        scrollToIndex(currentIndex);
        return;
      }

      const containerHeight = containerRef.current.clientHeight;
      const offset = el.offsetTop - containerHeight / 2 + el.clientHeight / 2;
      const newTargetScrollY = clampScrollY(-offset);

      const jumpDistancePx = Math.abs(
        targetScrollYRef.current - newTargetScrollY,
      );
      if (jumpDistancePx > 150) {
        setIsLargeJump(true);
      }

      scrollToIndex(currentIndex);
    },
    [clampScrollY, currentIndex, scrollToIndex],
  );

  const recenterCurrentLineAfterLayoutChange = useCallback(() => {
    if (isUserScrolling.current || currentIndex < 0) return;

    // 必须同步补偿（layout effect 阶段 DOM 已更新、尚未绘制）：
    // 滚动补偿的 y 弹簧与各行 layout 位移弹簧参数相同且同帧启动，
    // 二者逐帧抵消，当前行才能在开关翻译/罗马音时保持居中不动。
    // 若延迟到 rAF 之后，两个弹簧错帧启动，当前行会先弹开再弹回。
    scrollToIndex(currentIndex);
  }, [currentIndex, scrollToIndex]);

  useLayoutEffect(() => {
    const previous = lyricDisplayModeRef.current;
    if (previous.showTrans === showTrans && previous.showRoma === showRoma) {
      return;
    }

    lyricDisplayModeRef.current = { showTrans, showRoma };
    setIsLayoutChanging(true);
    recenterCurrentLineAfterLayoutChange();

    const timer = window.setTimeout(() => setIsLayoutChanging(false), 50);
    return () => window.clearTimeout(timer);
  }, [showTrans, showRoma, recenterCurrentLineAfterLayoutChange]);

  useEffect(() => {
    // 手动滚动时不跳回
    if (isUserScrolling.current) return;
    scrollToCurrentIndex();
  }, [scrollToCurrentIndex]);

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
    e.preventDefault();

    if (!containerRef.current || lyricLength === 0) return;

    handleUserInteraction();
    targetScrollYRef.current = clampScrollY(
      targetScrollYRef.current - e.deltaY,
    );
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
    <motion.div
      className={cn("h-full w-full relative", className)}
      // The panel entrance lives on this element on purpose: animating an
      // ANCESTOR (opacity/filter/transform) isolates the blending until the
      // animation settles and the glow visibly pops in, while animating the
      // blend element itself keeps plus-lighter live from the first frame.
      initial={{ opacity: 0, x: 46, scale: 0.985, filter: "blur(12px)" }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        filter: "none",
        transitionEnd: { filter: "none" },
      }}
      exit={{ opacity: 0, x: 32, scale: 0.99, filter: "blur(10px)" }}
      transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
      style={{
        // Additive blending against the mesh background is what gives the
        // lyrics their tinted, light-emitting Apple Music look. It must sit
        // on this outer element: the masked scroll container below forms an
        // isolated group, and a blend mode inside it would never reach the
        // background.
        mixBlendMode: "plus-lighter",
      }}
    >
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
          maskImage: MASK_IMAGE,
        }}
      >
        <motion.div
          className="w-full flex flex-col items-start gap-2"
          style={{
            color: "white",
            fontFamily: "var(--app-lyric-font-family, inherit)",
          }}
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
            const dynamicBlur = shouldBlur ? Math.min(6, distance * 1.8) : 0;

            return (
              <LyricLine
                key={`${lyricLine.lineStart}-${lyricLine.lineText}`}
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
    </motion.div>
  );
}
