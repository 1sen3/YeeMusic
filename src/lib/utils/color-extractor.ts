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

		tempCanvas.width = 64;
		tempCanvas.height = 64;

		ctx.filter =
			"contrast(40%) saturate(300%) contrast(170%) brightness(75%) blur(4px)";

		ctx.drawImage(imgSource, 0, 0, tempCanvas.width, tempCanvas.height);
		const imageData = ctx.getImageData(
			0,
			0,
			tempCanvas.width,
			tempCanvas.height,
		);

		const processedPixels = imageData.data;
		const colorSamples: number[][] = [];
		for (let i = 0; i < processedPixels.length; i += 4) {
			const r = processedPixels[i] / 255;
			const g = processedPixels[i + 1] / 255;
			const b = processedPixels[i + 2] / 255;
			const lum = 0.299 * r + 0.587 * g + 0.114 * b;

			if (lum > 0.03 && lum < 0.97) {
				colorSamples.push([r, g, b]);
			}
		}

		if (colorSamples.length < 5) {
			return FALLBACK_COLORS;
		}

		const centroids = kMeansPlusPlus(colorSamples, 5, 12);

		const clusters = assignClusters(colorSamples, centroids);
		const scored = centroids.map((c, i) => {
			const pop = clusters[i].length / colorSamples.length;
			const sat = saturation(c);
			return { color: c, score: pop * (0.3 + sat * 0.7) };
		});
		scored.sort((a, b) => b.score - a.score);

		return scored.map((s) => s.color);
	} catch (err) {
		console.error("[ColorExtractor]", err);
		return FALLBACK_COLORS;
	}
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
	pixels: number[][],
	k: number,
	maxIter: number,
): number[][] {
	const centroids: number[][] = [];

	// 第一个种子：选饱和度最高的像素
	let bestIdx = 0;
	let bestSat = -1;
	for (let i = 0; i < pixels.length; i += 3) {
		const s = saturation(pixels[i]);
		if (s > bestSat) {
			bestSat = s;
			bestIdx = i;
		}
	}
	centroids.push([...pixels[bestIdx]]);

	// 后续种子：选离已有种子最远的点
	for (let c = 1; c < k; c++) {
		let maxMinDist = -1;
		let farthestIdx = 0;
		for (let i = 0; i < pixels.length; i++) {
			let minDist = Infinity;
			for (let j = 0; j < centroids.length; j++) {
				const d = perceptualDistSq(pixels[i], centroids[j]);
				if (d < minDist) minDist = d;
			}
			if (minDist > maxMinDist) {
				maxMinDist = minDist;
				farthestIdx = i;
			}
		}
		centroids.push([...pixels[farthestIdx]]);
	}

	// 迭代优化
	for (let iter = 0; iter < maxIter; iter++) {
		const clusters = assignClusters(pixels, centroids);
		let converged = true;

		for (let c = 0; c < k; c++) {
			if (clusters[c].length === 0) continue;

			const newCentroid = [0, 0, 0];
			for (const px of clusters[c]) {
				newCentroid[0] += px[0];
				newCentroid[1] += px[1];
				newCentroid[2] += px[2];
			}
			newCentroid[0] /= clusters[c].length;
			newCentroid[1] /= clusters[c].length;
			newCentroid[2] /= clusters[c].length;

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
	pixels: number[][],
	centroids: number[][],
): number[][][] {
	const clusters: number[][][] = centroids.map(() => []);
	for (const px of pixels) {
		let minDist = Infinity;
		let bestCluster = 0;
		for (let c = 0; c < centroids.length; c++) {
			const d = perceptualDistSq(px, centroids[c]);
			if (d < minDist) {
				minDist = d;
				bestCluster = c;
			}
		}
		clusters[bestCluster].push(px);
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

/**
 * 计算 HSV 饱和度
 */
function saturation(c: number[]): number {
	const max = Math.max(c[0], c[1], c[2]);
	const min = Math.min(c[0], c[1], c[2]);
	return max < 0.001 ? 0 : (max - min) / max;
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
