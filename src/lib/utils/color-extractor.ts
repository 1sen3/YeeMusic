/**
 * 从图片中提取主要颜色
 * @param imgUrl - 图片 URL
 * @returns {Promise<number[][]>} 返回 5 个 [r, g, b]（0-1）
 */
export async function extractColors(imgUrl: string): Promise<number[][]> {
	try {
		const imgSource = await loadImage(imgUrl);

		const tempCanvas = document.createElement("canvas");
		const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });

		if (!ctx) {
			throw new Error("创建 Canvas 上下文失败");
		}

		tempCanvas.width = 72;
		tempCanvas.height = 72;

		ctx.filter = "contrast(92%) saturate(165%) brightness(98%) blur(1px)";

		ctx.drawImage(imgSource, 0, 0, tempCanvas.width, tempCanvas.height);
		const imageData = ctx.getImageData(
			0,
			0,
			tempCanvas.width,
			tempCanvas.height,
		);

		const processedPixels = imageData.data;
		const colorSamples: ColorSample[] = [];
		const neutralSamples: ColorSample[] = [];
		for (let i = 0; i < processedPixels.length; i += 4) {
			const r = processedPixels[i] / 255;
			const g = processedPixels[i + 1] / 255;
			const b = processedPixels[i + 2] / 255;
			const a = processedPixels[i + 3] / 255;
			const color = [r, g, b];
			const lum = luminance(color);

			if (a > 0.5 && lum > 0.04 && lum < 0.96) {
				const weight = getSampleWeight(color);
				if (weight > 0.05) {
					colorSamples.push({ color, weight });
				} else if (saturation(color) < 0.16) {
					neutralSamples.push({ color, weight: 0.08 });
				}
			}
		}

		if (colorSamples.length < 5) {
			colorSamples.push(...neutralSamples);
		}

		if (colorSamples.length < 5) {
			return FALLBACK_COLORS;
		}

		const centroids = kMeansPlusPlus(colorSamples, 7, 14);

		const clusters = assignClusters(colorSamples, centroids);
		const totalWeight = getTotalWeight(colorSamples);
		const scored = centroids.map((c, i) => {
			const clusterWeight = clusters[i].weight;
			const pop = totalWeight > 0 ? clusterWeight / totalWeight : 0;
			const sat = saturation(c);
			const lum = luminance(c);
			const hsl = rgbToHsl(c);
			const colorfulness = sat * (1 - Math.min(0.8, Math.abs(hsl.l - 0.56)));
			const lightnessScore = 1 - Math.min(0.48, Math.abs(lum - 0.56));
			return {
				color: tuneForBackground(c),
				score:
					Math.pow(pop, 0.58) *
					(0.24 + sat * 1.28 + colorfulness * 0.55) *
					lightnessScore,
			};
		});
		scored.sort((a, b) => b.score - a.score);

		return pickDistinctColors(scored, 5);
	} catch (err) {
		console.error("[ColorExtractor]", err);
		return FALLBACK_COLORS;
	}
}

interface ColorSample {
	color: number[];
	weight: number;
}

const FALLBACK_COLORS = [
	[0.15, 0.12, 0.22],
	[0.1, 0.08, 0.2],
	[0.08, 0.18, 0.3],
	[0.14, 0.1, 0.25],
	[0.12, 0.1, 0.18],
];

/**
 * K-Means++ 初始化 + 迭代
 */
function kMeansPlusPlus(
	samples: ColorSample[],
	k: number,
	maxIter: number,
): number[][] {
	const centroids: number[][] = [];

	// 第一个种子：选最适合作为背景色的高彩度样本
	let bestIdx = 0;
	let bestScore = -1;
	for (let i = 0; i < samples.length; i += 3) {
		const score = getSeedScore(samples[i].color) * samples[i].weight;
		if (score > bestScore) {
			bestScore = score;
			bestIdx = i;
		}
	}
	centroids.push([...samples[bestIdx].color]);

	// 后续种子：选离已有种子最远的点
	for (let c = 1; c < k; c++) {
		let maxMinDist = -1;
		let farthestIdx = 0;
		for (let i = 0; i < samples.length; i++) {
			let minDist = Infinity;
			for (let j = 0; j < centroids.length; j++) {
				const d = perceptualDistSq(samples[i].color, centroids[j]);
				if (d < minDist) minDist = d;
			}
			const weightedDist = minDist * (0.55 + samples[i].weight * 0.45);
			if (weightedDist > maxMinDist) {
				maxMinDist = weightedDist;
				farthestIdx = i;
			}
		}
		centroids.push([...samples[farthestIdx].color]);
	}

	// 迭代优化
	for (let iter = 0; iter < maxIter; iter++) {
		const clusters = assignClusters(samples, centroids);
		let converged = true;

		for (let c = 0; c < k; c++) {
			if (clusters[c].samples.length === 0 || clusters[c].weight <= 0) continue;

			const newCentroid = [0, 0, 0];
			for (const sample of clusters[c].samples) {
				newCentroid[0] += sample.color[0] * sample.weight;
				newCentroid[1] += sample.color[1] * sample.weight;
				newCentroid[2] += sample.color[2] * sample.weight;
			}
			newCentroid[0] /= clusters[c].weight;
			newCentroid[1] /= clusters[c].weight;
			newCentroid[2] /= clusters[c].weight;

			const shift = perceptualDistSq(centroids[c], newCentroid);
			if (shift > 0.0001) converged = false;

			centroids[c] = newCentroid;
		}

		if (converged) break;
	}

	return centroids;
}

/**
 * 将像素分配到最近的聚类中心
 */
function assignClusters(
	samples: ColorSample[],
	centroids: number[][],
): { samples: ColorSample[]; weight: number }[] {
	const clusters = centroids.map(() => ({
		samples: [] as ColorSample[],
		weight: 0,
	}));
	for (const sample of samples) {
		let minDist = Infinity;
		let bestCluster = 0;
		for (let c = 0; c < centroids.length; c++) {
			const d = perceptualDistSq(sample.color, centroids[c]);
			if (d < minDist) {
				minDist = d;
				bestCluster = c;
			}
		}
		clusters[bestCluster].samples.push(sample);
		clusters[bestCluster].weight += sample.weight;
	}
	return clusters;
}

/**
 * 感知加权距离平方
 */
function perceptualDistSq(c1: number[], c2: number[]): number {
	const dr = c1[0] - c2[0];
	const dg = c1[1] - c2[1];
	const db = c1[2] - c2[2];
	return dr * dr * 2 + dg * dg * 4 + db * db * 3;
}

function getSampleWeight(c: number[]): number {
	const hsl = rgbToHsl(c);
	const lum = luminance(c);
	const midLightness = 1 - Math.min(0.85, Math.abs(hsl.l - 0.56) * 1.35);
	const colorfulness = hsl.s * midLightness;
	let weight = 0.18 + Math.pow(hsl.s, 1.45) * 4.2 + colorfulness * 1.4;

	if (hsl.s < 0.14) weight *= 0.16;
	if (hsl.l < 0.16 || hsl.l > 0.88) weight *= 0.42;
	if (isSkinLikeNeutral(hsl)) weight *= 0.5;
	if (lum < 0.12 || lum > 0.9) weight *= 0.55;

	return weight;
}

function getSeedScore(c: number[]): number {
	const hsl = rgbToHsl(c);
	const lightnessScore = 1 - Math.min(0.75, Math.abs(hsl.l - 0.55) * 1.25);
	return (0.2 + hsl.s * 1.4) * lightnessScore;
}

function getTotalWeight(samples: ColorSample[]): number {
	return samples.reduce((total, sample) => total + sample.weight, 0);
}

function pickDistinctColors(
	scored: { color: number[]; score: number }[],
	count: number,
): number[][] {
	const selected: number[][] = [];
	const thresholds = [0.032, 0.022, 0.014, 0];

	for (const threshold of thresholds) {
		for (const item of scored) {
			if (selected.length >= count) break;
			if (
				selected.every(
					(color) => perceptualDistSq(color, item.color) > threshold,
				)
			) {
				selected.push(item.color);
			}
		}
		if (selected.length >= count) break;
	}

	const wash = averageColor(selected.length ? selected : FALLBACK_COLORS);
	while (selected.length < count) {
		const source =
			selected[selected.length % Math.max(1, selected.length)] || wash;
		selected.push(tuneForBackground(mixRgb(source, wash, 0.18)));
	}

	return selected.slice(0, count).map((color) => mixRgb(color, wash, 0.05));
}

function tuneForBackground(c: number[]): number[] {
	const hsl = rgbToHsl(c);

	if (hsl.h >= 45 && hsl.h <= 82) {
		hsl.h = mixHue(hsl.h, 38, 0.36);
		hsl.s *= 0.92;
	}

	if (hsl.h > 86 && hsl.h <= 155) {
		hsl.h = mixHue(hsl.h, 168, 0.22);
		hsl.s *= 0.9;
	}

	if (isSkinLikeNeutral(hsl)) {
		hsl.s *= 0.76;
		hsl.l = mixNumber(hsl.l, 0.54, 0.28);
	}

	const minSaturation = hsl.s < 0.16 ? hsl.s : 0.22;
	hsl.s = clamp(hsl.s * (1.06 + (1 - hsl.s) * 0.16), minSaturation, 0.74);
	hsl.l = clamp(hsl.l, 0.3, 0.74);

	const tuned = hslToRgb(hsl);
	const tunedLum = luminance(tuned);
	const lift =
		tunedLum < 0.36
			? (0.36 - tunedLum) * 0.35
			: tunedLum > 0.84
				? (0.84 - tunedLum) * 0.12
				: 0;

	return tuned.map((v) => clamp(v + lift, 0, 1));
}

function isSkinLikeNeutral({ h, s, l }: { h: number; s: number; l: number }) {
	return h >= 12 && h <= 42 && s < 0.52 && l > 0.46;
}

function luminance(c: number[]): number {
	return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
}

function averageColor(colors: number[][]): number[] {
	const total = colors.reduce(
		(acc, color) => {
			acc[0] += color[0];
			acc[1] += color[1];
			acc[2] += color[2];
			return acc;
		},
		[0, 0, 0],
	);

	return total.map((value) => value / colors.length);
}

function mixRgb(from: number[], to: number[], amount: number): number[] {
	return [
		mixNumber(from[0], to[0], amount),
		mixNumber(from[1], to[1], amount),
		mixNumber(from[2], to[2], amount),
	];
}

function rgbToHsl([r, g, b]: number[]) {
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;

	if (max === r) {
		h = (g - b) / d + (g < b ? 6 : 0);
	} else if (max === g) {
		h = (b - r) / d + 2;
	} else {
		h = (r - g) / d + 4;
	}

	return { h: h * 60, s, l };
}

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }) {
	if (s === 0) return [l, l, l];

	const hue = (((h % 360) + 360) % 360) / 360;
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;

	return [
		hueToRgb(p, q, hue + 1 / 3),
		hueToRgb(p, q, hue),
		hueToRgb(p, q, hue - 1 / 3),
	];
}

function hueToRgb(p: number, q: number, t: number): number {
	let nextT = t;
	if (nextT < 0) nextT += 1;
	if (nextT > 1) nextT -= 1;
	if (nextT < 1 / 6) return p + (q - p) * 6 * nextT;
	if (nextT < 1 / 2) return q;
	if (nextT < 2 / 3) return p + (q - p) * (2 / 3 - nextT) * 6;
	return p;
}

function mixHue(from: number, to: number, amount: number): number {
	const delta = ((((to - from) % 360) + 540) % 360) - 180;
	return (from + delta * amount + 360) % 360;
}

function mixNumber(from: number, to: number, amount: number): number {
	return from + (to - from) * amount;
}

/**
 * 计算 HSV 饱和度
 */
function saturation(c: number[]): number {
	const max = Math.max(c[0], c[1], c[2]);
	const min = Math.min(c[0], c[1], c[2]);
	return max < 0.001 ? 0 : (max - min) / max;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`加载图片失败: ${url}`));
		img.src = url;
	});
}
