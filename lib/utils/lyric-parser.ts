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

export function ParseLyric(rawString: string) {
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
            lineStart: 0,
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
