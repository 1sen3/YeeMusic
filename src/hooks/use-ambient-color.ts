import { useEffect, useState } from "react";
import {
	extractBackgroundColors,
	hslToRgb,
	type RgbColor,
	rgbToHsl,
} from "@/lib/utils/color-extractor";

export interface AmbientColors {
	/** 页面背景渐变顶部主色（明度跟随封面整体明暗） */
	base: string;
	/** 页面背景渐变底部深色 */
	deep: string;
	/** 白底主按钮上的文字/图标颜色 */
	accent: string;
}

const clamp = (v: number, min: number, max: number) =>
	Math.min(max, Math.max(min, v));

function toCss(rgb: RgbColor): string {
	const [r, g, b] = rgb.map((v) => Math.round(clamp(v, 0, 1) * 255));
	return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 从封面主色 + 封面平均亮度推导整页环境色。
 * 色相/饱和度取自主色，背景明度跟随封面整体明暗：
 * 黑底封面沉到近黑（只留主色的一点染色），亮封面压到中间调；
 * 上限 0.54 保证白色前景在任何封面上都可读。
 */
function buildAmbientColors(
	palette: RgbColor[],
	avgLuminance: number,
): AmbientColors {
	const { h, s } = rgbToHsl(palette[0]);
	// 近中性封面（黑白灰）不强行加饱和，否则会染出脏色
	const isNeutral = s < 0.12;

	const lBase = clamp(avgLuminance * 0.85, 0.14, 0.54);
	// 深色背景下高饱和会发霓虹，随明度降低同时收紧饱和度
	const sCap = lBase < 0.3 ? 0.38 : 0.62;

	const base = {
		h,
		s: isNeutral ? s : clamp(s, 0.16, sCap),
		l: lBase,
	};
	const deep = {
		h,
		s: base.s,
		l: Math.max(lBase - 0.1, 0.08),
	};
	const accent = {
		h,
		s: isNeutral ? s : clamp(s + 0.12, 0.4, 0.78),
		l: 0.38,
	};

	return {
		base: toCss(hslToRgb(base)),
		deep: toCss(hslToRgb(deep)),
		accent: toCss(hslToRgb(accent)),
	};
}

/** 提取封面主色并推导页面环境色，未就绪或失败时返回 null（页面保持原样式） */
export function useAmbientColor(imgUrl?: string | null): AmbientColors | null {
	const [colors, setColors] = useState<AmbientColors | null>(null);

	useEffect(() => {
		if (!imgUrl) {
			setColors(null);
			return;
		}

		let cancelled = false;
		setColors(null);
		extractBackgroundColors(imgUrl)
			.then(({ palette, avgLuminance }) => {
				if (!cancelled && palette.length > 0) {
					setColors(buildAmbientColors(palette, avgLuminance));
				}
			})
			.catch(() => {
				if (!cancelled) setColors(null);
			});

		return () => {
			cancelled = true;
		};
	}, [imgUrl]);

	return colors;
}
