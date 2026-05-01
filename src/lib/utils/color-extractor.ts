/**
 * 从图片中提取主要颜色
 * @param imgUrl - 图片 URL
 * @returns {Promise<number[][]>} 返回一个 Promise，解析为包含 5 个 [r, g, b] 数组的集合
 */
export async function extractColors(imgUrl: string): Promise<number[][]> {
  try {
    const imgSource = await loadImage(imgUrl);

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");

    if (!ctx) {
      throw new Error("创建 Canvas 上下文失败");
    }

    tempCanvas.width = 100;
    tempCanvas.height = 100;

    ctx.drawImage(imgSource, 0, 0, tempCanvas.width, tempCanvas.height);
    const imgData = ctx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
    ).data;

    let pixelColors = [];
    const step = 2;

    for (let i = 0; i < imgData.length; i += 4 * step) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      // const brightness = (r + g + b) / 3;
      const brightness = 0.299 * r + 0.587 * g + 0.144 * b;

      if (brightness > 10 && brightness < 245) {
        pixelColors.push([r / 255, g / 255, b / 255]);
      }
    }

    if (pixelColors.length === 0) return [[0.5, 0.5, 0.5]];

    let bestSeed = pixelColors[0];
    let maxSat = -1;
    for (let i = 0; i < pixelColors.length; i += 10) {
      let c = pixelColors[i];
      let sat = Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]);
      if (sat > maxSat) {
        maxSat = sat;
        bestSeed = c;
      }
    }

    let finalColors = [bestSeed];

    const targetColors = 5;
    const sampleSize = 1000;
    let paletteCandidates = [];
    for (let i = 0; i < sampleSize; ++i) {
      paletteCandidates.push(
        pixelColors[Math.floor(Math.random() * pixelColors.length)],
      );
    }

    for (let k = 1; k < targetColors; ++k) {
      let maxDist = -1;
      let bestCandidate = paletteCandidates[0];
      for (let i = 0; i < paletteCandidates.length; ++i) {
        let c = paletteCandidates[i];
        let minDistToExisting = 100.0;
        for (let j = 0; j < finalColors.length; ++j) {
          let d = distSq(c, finalColors[j]);
          if (d < minDistToExisting) minDistToExisting = d;
        }
        if (minDistToExisting > maxDist) {
          maxDist = minDistToExisting;
          bestCandidate = c;
        }
      }
      finalColors.push(bestCandidate);
    }
    while (finalColors.length < targetColors) {
      finalColors.push(finalColors[0]);
    }
    return finalColors;
  } catch (err) {
    console.error(err);
    return [];
  }
}

/**
 * 将 imgUrl 转换为 CanvasImageSource
 * @param {string} url - 图片 URL
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`加载图片失败: ${url}`));
    img.src = url;
  });
}

/**
 * 计算两个颜色之间的欧几里得距离平方
 * @param c1 - 颜色 A [r, g, b]
 * @param c2 - 颜色 B [r, g, b]
 */
function distSq(c1: number[], c2: number[]) {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];

  return dr * dr + dg * dg + db * db;
}
