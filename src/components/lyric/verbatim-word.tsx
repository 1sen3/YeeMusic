import { LyricWord } from "@/lib/utils/lyric-parser";
import {
  MotionValue,
  motion,
  useMotionTemplate,
  useSpring,
  useTransform,
} from "framer-motion";
import React, { useMemo } from "react";

export const VerbatimWord = React.memo(function VerbatimWord({
  word,
  currentTimeMotion,
}: {
  word: LyricWord;
  currentTimeMotion: MotionValue<number>;
}) {
  const emphasisFactor = React.useMemo(() => {
    const duration = word.duration;
    const text = word.char.trim();
    const isChinese = /[\u4e00-\u9fa5]/.test(text);

    if (isChinese) {
      return Math.min(Math.max(duration - 1000, 0) / 200, 1);
    } else {
      const isValidLength = text.length >= 1 && text.length <= 7;
      if (!isValidLength) return 0;
      return Math.min(Math.max(duration - 1000, 0) / 200, 1);
    }
  }, [word]);

  const rawProgress = useTransform(
    currentTimeMotion,
    [word.startTime, word.startTime + word.duration],
    [0, 1],
  );

  const progress = useSpring(rawProgress, {
    stiffness: 150,
    damping: 24,
    mass: 0.8,
  });
  const gradientPct = useTransform(progress, (p) => `${(1 - p) * 100}%`);
  const translateY = useTransform(progress, [0, 1], ["0px", "-2.4px"]);

  const brightness = useTransform(progress, [0, 0.5, 1], [0, 0.8, 0.6]);
  const backgroundImage = useMotionTemplate`linear-gradient(90deg,
      rgba(255,255,255,0.8) 0%,
      rgba(255,255,255,${brightness}) calc(100% - ${gradientPct}),
      rgba(255,255,255,0) calc(100% - ${gradientPct} + 15%),
      rgba(255,255,255,0) 100%
    )`;

  const baseGlow = useTransform(progress, [0, 0.25, 0.7, 1], [0, 1, 0.4, 0]);

  const glowBlur = useTransform(baseGlow, [0, 1], [0, 30 * emphasisFactor]);
  const glowOpacity = useTransform(baseGlow, [0, 1], [0, 0.6 * emphasisFactor]);

  const coreBlur = useTransform(baseGlow, [0, 1], [0, 8 * emphasisFactor]);
  const coreOpacity = useTransform(baseGlow, [0, 1], [0, 1.0 * emphasisFactor]);

  const textShadow = useMotionTemplate`
      0 0 ${coreBlur}px rgba(255, 255, 255, ${coreOpacity}),
      0 0 ${glowBlur}px rgba(255, 255, 255, ${glowOpacity})
    `;

  const chars = useMemo(() => word.char.split(""), [word.char]);
  const isWavy = !/[\u4e00-\u9fa5]/.test(word.char) && emphasisFactor > 0;

  const totalChars = chars.length;

  return (
    <motion.span
      style={{
        display: "inline-block",
        whiteSpace: "pre",
        fontWeight: "500",
        textShadow: textShadow,
        mixBlendMode: "plus-lighter",
        y: translateY,
        willChange: "transform",
      }}
    >
      {chars.map((char, idx) => (
        <WavyChar
          key={idx}
          char={char}
          idx={idx}
          progress={progress}
          isWavy={isWavy}
          emphasisFactor={emphasisFactor}
          backgroundImage={backgroundImage}
          totalChars={totalChars}
        />
      ))}
    </motion.span>
  );
});

const WavyChar = React.memo(function WavyChar({
  char,
  idx,
  progress,
  isWavy,
  emphasisFactor,
  backgroundImage,
  totalChars,
}: {
  char: string;
  idx: number;
  progress: MotionValue<number>;
  isWavy: boolean;
  emphasisFactor: number;
  backgroundImage: MotionValue<string>;
  totalChars: number;
}) {
  const charY = useTransform(progress, (p) => {
    if (!isWavy || p <= 0 || p >= 1) return 0;
    const sine = Math.sin(p * Math.PI * 2 * 2 - idx * 0.4);
    return sine * 2 * emphasisFactor * Math.sin(p * Math.PI);
  });

  return (
    <motion.span
      style={{
        display: "inline-block",
        y: charY,
        backgroundImage,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "rgba(255,255,255,0.4)",
        backgroundSize: `${totalChars * 100}% 100%`,
        willChange: "transform",
        backgroundPosition: `${(idx / Math.max(totalChars - 1, 1)) * 100}% 0%`,
      }}
    >
      {char}
    </motion.span>
  );
});
