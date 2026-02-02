import { getSongLyric } from "@/lib/services/song";
import { usePlayerStore } from "@/lib/store/playerStore";
import { cn } from "@/lib/utils";
import { LyricLine, ParseLyric } from "@/lib/utils/lyric-parser";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useScrollOverflowMask } from "@/hooks/use-scroll-overflow-mask";

export function LyricSheetSongLyric({ className }: { className?: string }) {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const [lyric, setLyric] = useState<LyricLine[]>([]);

  // 存储每行歌词的 DOM 引用
  const lyricRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 定期更新播放进度，确保歌词能跟随播放时间变化
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      updateProgress();
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, updateProgress]);

  useEffect(() => {
    if (!currentSong) return;
    getSongLyric(currentSong.id).then((res) => {
      if (res.code === 200) {
        setLyric(ParseLyric(res.lrc?.lyric || ""));
      }
    });
  }, [currentSong]);

  // 计算当前播放的歌词索引
  const currentIndex = useMemo(() => {
    const currentTimeMs = currentTime * 1000;
    for (let i = lyric.length - 1; i >= 0; i--) {
      if (lyric[i].lineStart <= currentTimeMs && lyric[i].lineStart > 0) {
        return i;
      }
    }
    return -1;
  }, [currentTime, lyric]);

  // 当歌词索引变化时，自动滚动到对应位置
  useEffect(() => {
    if (currentIndex >= 0 && lyricRefs.current[currentIndex]) {
      lyricRefs.current[currentIndex]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentIndex]);

  const containerHeight = 560;
  const totalHeight = lyric.length * 64;

  const { handleScroll, maskImage } = useScrollOverflowMask(
    totalHeight,
    containerHeight,
  );

  return (
    <div
      className={cn(
        "h-full w-full flex justify-center overflow-y-auto no-scrollbar scroll-smooth",
        className,
      )}
      onScroll={handleScroll}
      style={{ maskImage }}
    >
      <div className="h-full w-full flex justify-start">
        <div className="h-full flex flex-col gap-4">
          {lyric.map((lyricLine, idx) => (
            <SongLyricLine
              key={idx}
              ref={(el) => {
                lyricRefs.current[idx] = el;
              }}
              lyricLine={lyricLine}
              isActive={idx === currentIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { forwardRef } from "react";

export const SongLyricLine = forwardRef<
  HTMLDivElement,
  {
    lyricLine: LyricLine;
    isActive: boolean;
  }
>(({ lyricLine, isActive }, ref) => {
  return (
    <div
      ref={ref}
      className="cursor-pointer hover:bg-white/5 px-4 py-4 rounded-md"
    >
      <motion.div
        animate={{
          filter: isActive ? "blur(0px)" : "blur(2px)",
          opacity: isActive ? 0.8 : 0.2,
          fontWeight: isActive ? 700 : 500,
        }}
        transition={{ duration: 0.8 }}
      >
        <span
          className={cn(
            "text-3xl font-medium text-white mix-blend-plus-lighter drop-shadow-md transition-colors transform duration-300 ease-in",
          )}
        >
          {lyricLine.lineText}
        </span>
      </motion.div>
    </div>
  );
});

SongLyricLine.displayName = "SongLyricLine";
