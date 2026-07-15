export type RgbColor = [number, number, number];

export interface ExtractedBackgroundColors {
	palette: RgbColor[];
	mesh: RgbColor[];
	texture: ImageData | null;
}

const PALETTE_SIZE = 5;
const GRID_SIZE = 5;
const PROCESS_SIZE = 128;
// AMLL bg-render uses a 32px texture: heavy downsampling pre-mixes the cover's
// colors so the aggressive grade lands soft instead of banded.
const TEXTURE_SIZE = 32;

const FALLBACK_COLORS: RgbColor[] = [
	[0.15, 0.12, 0.22],
	[0.1, 0.08, 0.2],
	[0.08, 0.18, 0.3],
	[0.14, 0.1, 0.25],
	[0.12, 0.1, 0.18],
];

const backgroundColorCache = new Map<string, ExtractedBackgroundColors>();
const pendingBackgroundColors = new Map<
	string,
	Promise<ExtractedBackgroundColors>
>();

export async function extractColors(imgUrl: string): Promise<RgbColor[]> {
	const { palette } = await extractBackgroundColors(imgUrl);
	return palette;
}

export async function extractBackgroundColors(
	imgUrl: string,
): Promise<ExtractedBackgroundColors> {
	const cached = backgroundColorCache.get(imgUrl);
	if (cached) return cached;

	const pending = pendingBackgroundColors.get(imgUrl);
	if (pending) return pending;

	const task = computeBackgroundColors(imgUrl)
		.then((result) => {
			backgroundColorCache.set(imgUrl, result);
			if (backgroundColorCache.size > 24) {
				const oldestKey = backgroundColorCache.keys().next().value;
				if (oldestKey) backgroundColorCache.delete(oldestKey);
			}
			return result;
		})
		.finally(() => pendingBackgroundColors.delete(imgUrl));
	pendingBackgroundColors.set(imgUrl, task);
	return task;
}

export function getCachedBackgroundColors(
	imgUrl: string,
): ExtractedBackgroundColors | undefined {
	return backgroundColorCache.get(imgUrl);
}

async function computeBackgroundColors(
	imgUrl: string,
): Promise<ExtractedBackgroundColors> {
	try {
		const imgSource = await loadImage(imgUrl);
		const tempCanvas = document.createElement("canvas");
		const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });

		if (!ctx) {
			throw new Error("Failed to create canvas context");
		}

		tempCanvas.width = PROCESS_SIZE;
		tempCanvas.height = PROCESS_SIZE;

		ctx.drawImage(imgSource, 0, 0, tempCanvas.width, tempCanvas.height);

		const imageData = ctx.getImageData(
			0,
			0,
			tempCanvas.width,
			tempCanvas.height,
		);

		// Texture is what actually shows on screen (shader direct path). Follow
		// AMLL's bg-render exactly: crush the cover down to 32x32 so colors
		// pre-mix into soft fields, then run the shared grade plus a heavy
		// blur. The tiny size is what keeps the 3x saturation from turning
		// harsh — on a large bitmap the same grade produces hard color bands.
		const textureData = downsampleImage(imgSource, TEXTURE_SIZE);
		applyBgRenderGrade(textureData);
		blurImageData(textureData, 2, 4);

		// Palette / mesh extraction works on the sharper 128px copy.
		applyBgRenderGrade(imageData);
		blurImageData(imageData, 2, 2);

		const samples = collectSamples(imageData);

		if (samples.colorSamples.length < PALETTE_SIZE) {
			samples.colorSamples.push(...samples.neutralSamples);
		}

		if (samples.colorSamples.length < PALETTE_SIZE) {
			return {
				palette: FALLBACK_COLORS,
				mesh: buildMeshColorsFromPalette(FALLBACK_COLORS),
				texture: textureData,
			};
		}

		const centroids = kMeansPlusPlus(samples.colorSamples, 7, 14);
		const clusters = assignClusters(samples.colorSamples, centroids);
		const totalWeight = getTotalWeight(samples.colorSamples);
		const scored = centroids.map((color, i) => {
			const clusterWeight = clusters[i].weight;
			const pop = totalWeight > 0 ? clusterWeight / totalWeight : 0;
			const sat = saturation(color);
			const lum = luminance(color);
			const hsl = rgbToHsl(color);
			const colorfulness = sat * (1 - Math.min(0.8, Math.abs(hsl.l - 0.56)));
			const lightnessScore = 1 - Math.min(0.48, Math.abs(lum - 0.56));
			return {
				color: tuneForBackground(color),
				score:
					pop ** 0.58 *
					(0.24 + sat * 1.28 + colorfulness * 0.55) *
					lightnessScore,
			};
		});
		scored.sort((a, b) => b.score - a.score);

		const palette = pickDistinctColors(scored, PALETTE_SIZE);
		const mesh = extractSpatialMeshColors(imageData, palette);

		return { palette, mesh, texture: textureData };
	} catch (err) {
		console.error("[ColorExtractor]", err);
		return {
			palette: FALLBACK_COLORS,
			mesh: buildMeshColorsFromPalette(FALLBACK_COLORS),
			texture: null,
		};
	}
}

interface ColorSample {
	color: RgbColor;
	weight: number;
}

function collectSamples(imageData: ImageData): {
	colorSamples: ColorSample[];
	neutralSamples: ColorSample[];
} {
	const processedPixels = imageData.data;
	const colorSamples: ColorSample[] = [];
	const neutralSamples: ColorSample[] = [];

	for (let i = 0; i < processedPixels.length; i += 4) {
		const color: RgbColor = [
			processedPixels[i] / 255,
			processedPixels[i + 1] / 255,
			processedPixels[i + 2] / 255,
		];
		const a = processedPixels[i + 3] / 255;
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

	return { colorSamples, neutralSamples };
}

function applyBgRenderGrade(imageData: ImageData): void {
	const pixels = imageData.data;

	for (let i = 0; i < pixels.length; i += 4) {
		let r = pixels[i];
		let g = pixels[i + 1];
		let b = pixels[i + 2];

		r = (r - 128) * 0.4 + 128;
		g = (g - 128) * 0.4 + 128;
		b = (b - 128) * 0.4 + 128;

		const gray = r * 0.3 + g * 0.59 + b * 0.11;
		r = gray * -2 + r * 3;
		g = gray * -2 + g * 3;
		b = gray * -2 + b * 3;

		r = (r - 128) * 1.7 + 128;
		g = (g - 128) * 1.7 + 128;
		b = (b - 128) * 1.7 + 128;

		pixels[i] = clamp(r * 0.75, 0, 255);
		pixels[i + 1] = clamp(g * 0.75, 0, 255);
		pixels[i + 2] = clamp(b * 0.75, 0, 255);
	}
}

function downsampleImage(
	imgSource: HTMLImageElement,
	size: number,
): ImageData {
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) {
		throw new Error("Failed to create texture canvas context");
	}
	ctx.drawImage(imgSource, 0, 0, size, size);
	return ctx.getImageData(0, 0, size, size);
}

function blurImageData(
	imageData: ImageData,
	radius: number,
	iterations: number,
): void {
	if (radius <= 0 || iterations <= 0) return;

	const { data, width, height } = imageData;
	const source = new Uint8ClampedArray(data);
	const target = new Uint8ClampedArray(data.length);

	for (let iter = 0; iter < iterations; iter++) {
		boxBlurPass(source, target, width, height, radius, true);
		boxBlurPass(target, source, width, height, radius, false);
	}

	data.set(source);
}

function boxBlurPass(
	source: Uint8ClampedArray,
	target: Uint8ClampedArray,
	width: number,
	height: number,
	radius: number,
	horizontal: boolean,
): void {
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			let r = 0;
			let g = 0;
			let b = 0;
			let a = 0;
			let count = 0;

			for (let offset = -radius; offset <= radius; offset++) {
				const sx = horizontal ? clampInt(x + offset, 0, width - 1) : x;
				const sy = horizontal ? y : clampInt(y + offset, 0, height - 1);
				const idx = (sy * width + sx) * 4;
				r += source[idx];
				g += source[idx + 1];
				b += source[idx + 2];
				a += source[idx + 3];
				count++;
			}

			const out = (y * width + x) * 4;
			target[out] = r / count;
			target[out + 1] = g / count;
			target[out + 2] = b / count;
			target[out + 3] = a / count;
		}
	}
}

function extractSpatialMeshColors(
	imageData: ImageData,
	palette: RgbColor[],
): RgbColor[] {
	const mesh: RgbColor[] = [];
	const wash = averageColor(palette);

	for (let gy = 0; gy < GRID_SIZE; gy++) {
		for (let gx = 0; gx < GRID_SIZE; gx++) {
			const cellColor = sampleCellColor(imageData, gx, gy);
			const isEdge =
				gx === 0 || gx === GRID_SIZE - 1 || gy === 0 || gy === GRID_SIZE - 1;
			const tuned = tuneForMesh(cellColor);
			mesh.push(mixRgb(tuned, wash, isEdge ? 0.13 : 0.07));
		}
	}

	return mesh;
}

function sampleCellColor(
	imageData: ImageData,
	gx: number,
	gy: number,
): RgbColor {
	const { data, width, height } = imageData;
	const x0 = Math.floor((gx / GRID_SIZE) * width);
	const x1 = Math.ceil(((gx + 1) / GRID_SIZE) * width);
	const y0 = Math.floor((gy / GRID_SIZE) * height);
	const y1 = Math.ceil(((gy + 1) / GRID_SIZE) * height);
	const cx = (x0 + x1 - 1) / 2;
	const cy = (y0 + y1 - 1) / 2;

	let r = 0;
	let g = 0;
	let b = 0;
	let total = 0;

	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const idx = (y * width + x) * 4;
			const color: RgbColor = [
				data[idx] / 255,
				data[idx + 1] / 255,
				data[idx + 2] / 255,
			];
			const alpha = data[idx + 3] / 255;
			const dx = (x - cx) / Math.max(1, x1 - x0);
			const dy = (y - cy) / Math.max(1, y1 - y0);
			const centerWeight = 1 - Math.min(0.72, Math.sqrt(dx * dx + dy * dy));
			const weight = alpha * centerWeight * (0.7 + saturation(color) * 0.55);

			r += color[0] * weight;
			g += color[1] * weight;
			b += color[2] * weight;
			total += weight;
		}
	}

	if (total <= 0) return FALLBACK_COLORS[(gx + gy) % FALLBACK_COLORS.length];
	return [r / total, g / total, b / total];
}

function buildMeshColorsFromPalette(palette: RgbColor[]): RgbColor[] {
	const mesh: RgbColor[] = [];
	const wash = averageColor(palette);

	for (let y = 0; y < GRID_SIZE; y++) {
		for (let x = 0; x < GRID_SIZE; x++) {
			const primary = palette[(x + y * 2) % palette.length];
			const secondary = palette[(x * 2 + y + 2) % palette.length];
			const isEdge =
				x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1;
			mesh.push(
				mixRgb(
					mixRgb(primary, secondary, 0.28 + ((x + y) % 3) * 0.05),
					wash,
					isEdge ? 0.24 : 0.14,
				),
			);
		}
	}

	return mesh;
}

function kMeansPlusPlus(
	samples: ColorSample[],
	k: number,
	maxIter: number,
): RgbColor[] {
	const centroids: RgbColor[] = [];

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

	for (let iter = 0; iter < maxIter; iter++) {
		const clusters = assignClusters(samples, centroids);
		let converged = true;

		for (let c = 0; c < k; c++) {
			if (clusters[c].samples.length === 0 || clusters[c].weight <= 0) continue;

			const newCentroid: RgbColor = [0, 0, 0];
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

function assignClusters(
	samples: ColorSample[],
	centroids: RgbColor[],
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

function perceptualDistSq(c1: RgbColor, c2: RgbColor): number {
	const dr = c1[0] - c2[0];
	const dg = c1[1] - c2[1];
	const db = c1[2] - c2[2];
	return dr * dr * 2 + dg * dg * 4 + db * db * 3;
}

function getSampleWeight(c: RgbColor): number {
	const hsl = rgbToHsl(c);
	const lum = luminance(c);
	const midLightness = 1 - Math.min(0.85, Math.abs(hsl.l - 0.56) * 1.35);
	const colorfulness = hsl.s * midLightness;
	let weight = 0.18 + hsl.s ** 1.45 * 4.2 + colorfulness * 1.4;

	if (hsl.s < 0.14) weight *= 0.16;
	if (hsl.l < 0.16 || hsl.l > 0.88) weight *= 0.42;
	if (isSkinLikeNeutral(hsl)) weight *= 0.5;
	if (lum < 0.12 || lum > 0.9) weight *= 0.55;

	return weight;
}

function getSeedScore(c: RgbColor): number {
	const hsl = rgbToHsl(c);
	const lightnessScore = 1 - Math.min(0.75, Math.abs(hsl.l - 0.55) * 1.25);
	return (0.2 + hsl.s * 1.4) * lightnessScore;
}

function getTotalWeight(samples: ColorSample[]): number {
	return samples.reduce((total, sample) => total + sample.weight, 0);
}

function pickDistinctColors(
	scored: { color: RgbColor; score: number }[],
	count: number,
): RgbColor[] {
	const selected: RgbColor[] = [];
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

function tuneForBackground(c: RgbColor): RgbColor {
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

	return tuned.map((v) => clamp(v + lift, 0, 1)) as RgbColor;
}

function tuneForMesh(c: RgbColor): RgbColor {
	const hsl = rgbToHsl(c);

	if (hsl.h >= 50 && hsl.h <= 78) {
		hsl.h = mixHue(hsl.h, 40, 0.22);
		hsl.s *= 0.95;
	}

	if (hsl.h > 90 && hsl.h <= 150) {
		hsl.h = mixHue(hsl.h, 166, 0.16);
	}

	if (isSkinLikeNeutral(hsl)) {
		hsl.s *= 0.84;
		hsl.l = mixNumber(hsl.l, 0.52, 0.16);
	}

	hsl.s = clamp(hsl.s * 1.08, hsl.s < 0.14 ? hsl.s : 0.2, 0.86);
	hsl.l = clamp(hsl.l, 0.24, 0.76);

	return hslToRgb(hsl);
}

function isSkinLikeNeutral({ h, s, l }: { h: number; s: number; l: number }) {
	return h >= 12 && h <= 42 && s < 0.52 && l > 0.46;
}

function luminance(c: RgbColor): number {
	return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
}

function averageColor(colors: RgbColor[]): RgbColor {
	const total = colors.reduce(
		(acc, color) => {
			acc[0] += color[0];
			acc[1] += color[1];
			acc[2] += color[2];
			return acc;
		},
		[0, 0, 0] as RgbColor,
	);

	return total.map((value) => value / colors.length) as RgbColor;
}

function mixRgb(from: RgbColor, to: RgbColor, amount: number): RgbColor {
	return [
		mixNumber(from[0], to[0], amount),
		mixNumber(from[1], to[1], amount),
		mixNumber(from[2], to[2], amount),
	];
}

function rgbToHsl([r, g, b]: RgbColor) {
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

function hslToRgb({ h, s, l }: { h: number; s: number; l: number }): RgbColor {
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

function saturation(c: RgbColor): number {
	const max = Math.max(c[0], c[1], c[2]);
	const min = Math.min(c[0], c[1], c[2]);
	return max < 0.001 ? 0 : (max - min) / max;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function clampInt(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value)) | 0;
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "Anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
		img.src = url;
	});
}
