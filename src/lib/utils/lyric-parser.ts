export interface LyricWord {
	startTime: number;
	duration: number;
	char: string;
}

export interface ILyricLine {
	lineStart: number;
	lineEnd?: number; // 由空行时间戳标记的结束时间
	lineText: string;
	words?: LyricWord[]; // 逐字歌词用，逐行歌词为 undefined
	isBG?: boolean;
	isLeadDots?: boolean;
	leadDotsDuration?: number;
}

function insertLeadDots(lyrics: ILyricLine[]): ILyricLine[] {
	if (lyrics.length === 0) return lyrics;

	const MIN_GAP = 5000;
	const FIRST_DOT_DELAY = 1000;

	const result: ILyricLine[] = [];

	// 前奏：第一行歌词之前如果间隔足够长，插入 dots
	if (lyrics[0].lineStart >= MIN_GAP) {
		result.push({
			lineStart: 0,
			lineText: "···",
			isLeadDots: true,
			leadDotsDuration: lyrics[0].lineStart,
		});
	}

	for (let i = 0; i < lyrics.length; i++) {
		result.push(lyrics[i]);
		if (i < lyrics.length - 1) {
			const current = lyrics[i];
			const next = lyrics[i + 1];

			// 没有明确的结束时间标记，不插入 dots
			if (current.lineEnd == null) continue;

			const gap = next.lineStart - current.lineEnd;

			if (gap >= MIN_GAP) {
				// dots 出现在过门起点稍后
				const dotDelay = Math.min(FIRST_DOT_DELAY, gap * 0.3);
				const dotTime = current.lineEnd + dotDelay;
				result.push({
					lineStart: Math.round(dotTime),
					lineText: "···",
					isLeadDots: true,
					leadDotsDuration: next.lineStart - Math.round(dotTime),
				});
			}
		}
	}
	return result;
}

function checkIsBgLine(text: string): { text: string; isBG: boolean } {
	const trimmed = text.trim();
	if (trimmed.startsWith("（") && trimmed.endsWith("）")) {
		return { text: trimmed.slice(1, -1), isBG: true };
	}
	if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
		return { text: trimmed.slice(1, -1), isBG: true };
	}
	return { text, isBG: false };
}

/**
 * 将 duration 为 0 的字符合并到相邻的非零字上，
 * 避免 useTransform 输入区间退化导致显示异常。
 * 向后合并：零时长字 append 到前一个字；
 * 行首的零时长字则 prepend 到后一个字。
 */
function mergeZeroDuration(words: LyricWord[]): LyricWord[] {
	if (words.length === 0) return words;

	const result: LyricWord[] = [];
	let pending = "";

	for (const w of words) {
		if (w.duration === 0) {
			if (result.length > 0) {
				result[result.length - 1] = {
					...result[result.length - 1],
					char: result[result.length - 1].char + w.char,
				};
			} else {
				pending += w.char;
			}
		} else {
			result.push({ ...w, char: pending + w.char });
			pending = "";
		}
	}

	if (pending && result.length > 0) {
		const last = result[result.length - 1];
		result[result.length - 1] = { ...last, char: last.char + pending };
	}

	return result;
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

	const lyrics: ILyricLine[] = [];

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		if (!trimmedLine) return;

		const match = lrcRegex.exec(trimmedLine);
		if (match) {
			const m = parseInt(match[1]);
			const s = parseInt(match[2]);
			const ms = parseInt(match[3]);
			const time = m * 60 * 1000 + s * 1000 + ms;
			const text = match[4].trim();

			if (text) {
				// 有歌词文本的行，正常添加
				const bg = checkIsBgLine(text);
				lyrics.push({
					lineStart: time,
					lineText: bg.text,
					isBG: bg.isBG,
				});
			} else if (lyrics.length > 0) {
				// 空歌词行：[01:40.48]\n —— 标记前一行的结束时间（过门开始）
				lyrics[lyrics.length - 1].lineEnd = time;
			}
		}
	});

	return insertLeadDots(lyrics);
}

/**
 * 解析逐字歌词
 * @param rawString 逐字歌词字符串
 * @returns 返回解析得到的 LyricLine
 */
export function ParseVerbatimLyric(rawString: string | undefined) {
	if (!rawString) return null;

	const lines = rawString.split("\n");
	const lyrics: ILyricLine[] = [];

	const lineRegex = /^\[(\d+),(\d+)\]/;
	const wordRegex = /\((\d+),(\d+),\d+\)([^()]+)/g;

	lines.forEach((line) => {
		const trimmedLine = line.trim();
		if (!trimmedLine) return;

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
				const merged = mergeZeroDuration(words);
				const bg = checkIsBgLine(lineText);
				const finalWords = bg.isBG ? merged.slice(1, -1) : merged;
				if (finalWords.length > 0) {
					// 逐字歌词可直接从最后一个 word 算出行结束时间
					const lastWord = finalWords[finalWords.length - 1];
					const lineEnd = lastWord.startTime + lastWord.duration;
					lyrics.push({
						lineStart,
						lineEnd,
						lineText: bg.text,
						words: finalWords,
						isBG: bg.isBG,
					});
				}
			}
		}
	});

	return insertLeadDots(lyrics);
}
