export interface MetaContent {
  tx: string; // 文本内容
  li?: string; // 图片链接
  or?: string; // 站内链接
}

export interface LyricWord {
  startTime: number;
  duration: number;
  char: string;
}

export interface LyricLine {
  lineStart: number;
  lineText: string;
  words?: LyricWord[]; // 逐字歌词用，逐行歌词为 undefined
}

/**
 * 解析普通 lrc 歌词
 * @param rawString lrc 歌词字符串
 * @returns 返回解析得到的 LyricLine
 */
export function ParseLyric(rawString: string | undefined) {
  if (!rawString) return null;

  const lines = rawString.split("\n");

  const lrcRegex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  const lyrics: LyricLine[] = [];

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    // 元数据
    if (trimmedLine.startsWith("{")) {
      try {
        const jsonObj = JSON.parse(trimmedLine);
        if (jsonObj.c && Array.isArray(jsonObj.c)) {
          const label = jsonObj.c[0]?.tx || "";
          const value = jsonObj.c
            .slice(1)
            .map((item: MetaContent) => item.tx)
            .join("");
          lyrics.push({
            lineStart: jsonObj.t,
            lineText: `${label}${value}`,
          });
        }
      } catch (e) {
        console.error("解析歌词失败", e);
      }
      return;
    }

    const match = lrcRegex.exec(trimmedLine);
    if (match) {
      const m = parseInt(match[1]);
      const s = parseInt(match[2]);
      const ms = parseInt(match[3]);
      const time = m * 60 * 1000 + s * 1000 + ms;
      const text = match[4].trim();

      if (text) {
        lyrics.push({ lineStart: time, lineText: text });
      }
    }
  });

  return lyrics;
}

/**
 * 解析逐字歌词
 * @param rawString 逐字歌词字符串
 * @returns 返回解析得到的 LyricLine
 */
export function ParseVerbatimLyric(rawString: string | undefined) {
  if (!rawString) return null;

  const lines = rawString.split("\n");
  const lyrics: LyricLine[] = [];

  const lineRegex = /^\[(\d+),(\d+)\]/;
  const wordRegex = /\((\d+),(\d+),\d+\)([^()]+)/g;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    if (trimmedLine.startsWith("{")) {
      try {
        const jsonObj = JSON.parse(trimmedLine);
        if (jsonObj.c && Array.isArray(jsonObj.c)) {
          const label = jsonObj.c[0]?.tx || "";
          const value = jsonObj.c
            .slice(1)
            .map((item: MetaContent) => item.tx)
            .join("");
          lyrics.push({
            lineStart: jsonObj.t,
            lineText: `${label}${value}`,
          });
        }
      } catch (e) {
        console.error("解析歌词失败", e);
      }
      return;
    }

    const lineMatch = lineRegex.exec(trimmedLine);
    if (lineMatch) {
      const lineStart = parseInt(lineMatch[1]);
      const words: LyricWord[] = [];
      let lineText = "";

      let wordMatch;

      while ((wordMatch = wordRegex.exec(trimmedLine)) !== null) {
        const startTime = parseInt(wordMatch[1]);
        const duration = parseInt(wordMatch[2]);
        const char = wordMatch[3];

        words.push({ startTime, duration, char });
        lineText += char;
      }

      if (words.length > 0) {
        lyrics.push({ lineStart, lineText, words });
      }
    }
  });

  return lyrics;
}
