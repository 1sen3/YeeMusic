import { Transition } from "framer-motion";

export const LYRIC_TEXT_SPRING: Transition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
} as const;

export const LYRIC_SCROLL_SPRING = {
  type: "spring" as const,
  stiffness: 80,
  damping: 25,
  mass: 1,
  restDelta: 0.01,
};

export const LYRIC_JUMP_SPRING = {
  type: "spring" as const,
  stiffness: 120,
  damping: 20,
  mass: 0.5,
};

export const VERBATIM_PROGRESS_SPRING = {
  type: "spring" as const,
  stiffness: 220,
  damping: 28,
  mass: 1.05,
  restSpeed: 10,
};

export const VERBATIM_TRANSLATE_SPRING = {
  type: "spring" as const,
  stiffness: 120,
  damping: 22,
  mass: 1,
};

export const INSTANT_TWEEN: Transition = {
  type: "tween",
  duration: 0,
  ease: "linear",
} as const;

export const LAYOUT_TRANSITION = { ...LYRIC_SCROLL_SPRING };

/**
 * 根据当前滚动状态返回 Y 轴过渡配置
 */
export function getScrollYTransition(opts: {
  isLayoutChanging: boolean;
  isScrolling: boolean;
  isLargeJump: boolean;
  scrollDelay: number;
}): Transition {
  if (opts.isLayoutChanging) {
    return { ...LYRIC_SCROLL_SPRING, delay: 0 };
  }
  if (opts.isScrolling) {
    return INSTANT_TWEEN;
  }
  if (opts.isLargeJump) {
    return { ...LYRIC_JUMP_SPRING, delay: 0 };
  }
  return { ...LYRIC_SCROLL_SPRING, delay: opts.scrollDelay };
}

/**
 * @LyricAnimations
 *
 * 致谢:
 * 缓动函数参考自以下开源项目：
 *
 * - 项目名称: applemusic-like-lyrics
 * - 原作者: amll-dev
 * - 项目地址: https://github.com/amll-dev/applemusic-like-lyrics
 *
 * - 特此向原作者表示感谢。
 */

export function easeOutExpo(x: number): number {
  return x >= 1 ? 1 : 1 - 2 ** (-10 * x);
}
export function easeInOutBack(x: number): number {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return x < 0.5
    ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2
    : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}
