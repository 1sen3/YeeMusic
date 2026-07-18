export type ShortcutAction =
	| "togglePlay"
	| "prev"
	| "next"
	| "volumeUp"
	| "volumeDown"
	| "toggleLike";

export interface ShortcutActionMeta {
	action: ShortcutAction;
	label: string;
}

/** 快捷键设置页与匹配逻辑共用的动作列表（顺序即展示顺序） */
export const SHORTCUT_ACTION_LIST: ShortcutActionMeta[] = [
	{ action: "togglePlay", label: "播放 / 暂停" },
	{ action: "prev", label: "上一首" },
	{ action: "next", label: "下一首" },
	{ action: "volumeUp", label: "音量加" },
	{ action: "volumeDown", label: "音量减" },
	{ action: "toggleLike", label: "喜欢歌曲" },
];

/** 绑定串为规范化格式："Ctrl+Alt+Shift+Meta+Key"，空串表示未设置 */
export type ShortcutBindings = Record<ShortcutAction, string>;

export const defaultShortcutBindings: ShortcutBindings = {
	togglePlay: "Ctrl+P",
	prev: "Ctrl+Left",
	next: "Ctrl+Right",
	volumeUp: "Ctrl+Up",
	volumeDown: "Ctrl+Down",
	toggleLike: "Ctrl+L",
};

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

const KEY_ALIASES: Record<string, string> = {
	" ": "Space",
	ArrowUp: "Up",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	Escape: "Esc",
};

function normalizeKey(key: string): string {
	const aliased = KEY_ALIASES[key] ?? key;
	return aliased.length === 1 ? aliased.toUpperCase() : aliased;
}

export type BindingCaptureResult =
	| { status: "ok"; binding: string }
	| { status: "pending" }
	| { status: "need-modifier" };

/**
 * 将键盘事件转换为规范化绑定串。
 * 仅按下修饰键时返回 pending；可打印字符键必须搭配 Ctrl/Alt/Meta，
 * 避免与正常文字输入冲突。
 */
export function captureBinding(e: KeyboardEvent): BindingCaptureResult {
	if (MODIFIER_KEYS.has(e.key)) return { status: "pending" };

	const key = normalizeKey(e.key);
	const hasRealModifier = e.ctrlKey || e.altKey || e.metaKey;
	if (key.length === 1 && !hasRealModifier) {
		return { status: "need-modifier" };
	}

	const parts: string[] = [];
	if (e.ctrlKey) parts.push("Ctrl");
	if (e.altKey) parts.push("Alt");
	if (e.shiftKey) parts.push("Shift");
	if (e.metaKey) parts.push("Meta");
	parts.push(key);
	return { status: "ok", binding: parts.join("+") };
}

/** 匹配用：把事件转换为绑定串（不匹配任何绑定时无副作用） */
export function eventToBinding(e: KeyboardEvent): string | null {
	const result = captureBinding(e);
	return result.status === "ok" ? result.binding : null;
}

const DISPLAY_ALIASES: Record<string, string> = {
	Up: "↑",
	Down: "↓",
	Left: "←",
	Right: "→",
	Meta: "Win",
};

/** 将绑定串拆为用于 <Kbd> 展示的按键片段 */
export function bindingToParts(binding: string): string[] {
	if (!binding) return [];
	return binding.split("+").map((part) => DISPLAY_ALIASES[part] ?? part);
}

/** 返回存在冲突（被多个动作使用）的绑定串集合 */
export function findConflictBindings(bindings: ShortcutBindings): Set<string> {
	const seen = new Map<string, number>();
	for (const binding of Object.values(bindings)) {
		if (!binding) continue;
		seen.set(binding, (seen.get(binding) ?? 0) + 1);
	}
	return new Set(
		[...seen.entries()].filter(([, count]) => count > 1).map(([b]) => b),
	);
}

const ACCELERATOR_MODIFIERS: Record<string, string> = {
	Ctrl: "Control",
	Alt: "Alt",
	Shift: "Shift",
	Meta: "Super",
};

const ACCELERATOR_KEYS: Record<string, string> = {
	Up: "ArrowUp",
	Down: "ArrowDown",
	Left: "ArrowLeft",
	Right: "ArrowRight",
	Esc: "Escape",
	",": "Comma",
	".": "Period",
	"/": "Slash",
	";": "Semicolon",
	"'": "Quote",
	"[": "BracketLeft",
	"]": "BracketRight",
	"\\": "Backslash",
	"-": "Minus",
	"=": "Equal",
	"`": "Backquote",
};

/**
 * 将绑定串转换为 Tauri global-shortcut 的加速器格式（基于 keyboard-types Code），
 * 无法映射的按键返回 null
 */
export function bindingToAccelerator(binding: string): string | null {
	if (!binding) return null;
	const parts = binding.split("+");
	const key = parts.pop();
	if (!key) return null;

	const accParts: string[] = [];
	for (const mod of parts) {
		const mapped = ACCELERATOR_MODIFIERS[mod];
		if (!mapped) return null;
		accParts.push(mapped);
	}

	let accKey: string | undefined = ACCELERATOR_KEYS[key];
	if (!accKey) {
		if (/^[A-Z]$/.test(key)) accKey = `Key${key}`;
		else if (/^[0-9]$/.test(key)) accKey = `Digit${key}`;
		else if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key) || key === "Space")
			accKey = key;
		else return null;
	}
	accParts.push(accKey);
	return accParts.join("+");
}
