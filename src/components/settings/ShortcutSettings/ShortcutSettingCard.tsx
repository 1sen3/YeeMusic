import { Keyboard20Regular } from "@fluentui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
	bindingToParts,
	captureBinding,
	findConflictBindings,
	SHORTCUT_ACTION_LIST,
	type ShortcutAction,
} from "@/lib/constants/shortcuts";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import {
	resumeGlobalShortcuts,
	suspendGlobalShortcuts,
} from "@/lib/shortcuts/global-shortcut-manager";
import { cn } from "@/lib/utils";

export function ShortcutSettingCard() {
	const bindings = useSettingStore((s) => s.shortcuts.bindings);
	const setShortcutBinding = useSettingStore((s) => s.setShortcutBinding);
	const resetShortcuts = useSettingStore((s) => s.resetShortcuts);

	const [recordingAction, setRecordingAction] = useState<ShortcutAction | null>(
		null,
	);
	const [needModifierHint, setNeedModifierHint] = useState(false);

	const conflicts = useMemo(() => findConflictBindings(bindings), [bindings]);

	useEffect(() => {
		if (!recordingAction) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			e.preventDefault();
			e.stopImmediatePropagation();

			if (e.key === "Escape") {
				setRecordingAction(null);
				return;
			}
			if (e.key === "Backspace" || e.key === "Delete") {
				setShortcutBinding(recordingAction, "");
				setRecordingAction(null);
				return;
			}

			const result = captureBinding(e);
			if (result.status === "pending") return;
			if (result.status === "need-modifier") {
				setNeedModifierHint(true);
				return;
			}
			setShortcutBinding(recordingAction, result.binding);
			setRecordingAction(null);
		};

		const cancel = () => setRecordingAction(null);

		window.addEventListener("keydown", handleKeyDown, true);
		window.addEventListener("blur", cancel);
		window.addEventListener("pointerdown", cancel);
		return () => {
			window.removeEventListener("keydown", handleKeyDown, true);
			window.removeEventListener("blur", cancel);
			window.removeEventListener("pointerdown", cancel);
		};
	}, [recordingAction, setShortcutBinding]);

	useEffect(() => {
		setNeedModifierHint(false);
		// 录制期间临时注销全局快捷键，否则按键会被系统层拦截而无法录入
		if (recordingAction) {
			suspendGlobalShortcuts();
			return () => resumeGlobalShortcuts();
		}
	}, [recordingAction]);

	return (
		<SettingsExpandar
			title="快捷键"
			subtitle="自定义播放控制的全局快捷键"
			icon={<Keyboard20Regular />}
			trailing={
				conflicts.size > 0 ? (
					<span className="text-sm text-destructive">
						{conflicts.size} 组快捷键冲突
					</span>
				) : undefined
			}
		>
			{SHORTCUT_ACTION_LIST.map(({ action, label }) => {
				const binding = bindings[action];
				const isRecording = recordingAction === action;
				const isConflict = !!binding && conflicts.has(binding);

				return (
					<SettingsExpandarDetail key={action} desc={label}>
						<div className="flex items-center gap-3">
							<AnimatePresence initial={false} mode="wait">
								{isConflict && !isRecording && (
									<motion.span
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
										className="text-xs text-destructive"
									>
										与其他快捷键冲突
									</motion.span>
								)}
							</AnimatePresence>

							<button
								type="button"
								onClick={() =>
									setRecordingAction(isRecording ? null : action)
								}
								onPointerDown={(e) => e.stopPropagation()}
								className={cn(
									"flex h-8 w-fit items-center justify-center gap-1 rounded-md border p-1 transition-all duration-150 active:scale-[0.97]",
									isRecording
										? "px-2 bg-primary/[0.06] ring-2 ring-primary/25"
										: isConflict
											? "border-destructive/45 bg-destructive/[0.06] hover:bg-destructive/10"
											: "border-0  hover:bg-foreground/[0.06]",
								)}
							>
								{isRecording ? (
									<span className="animate-pulse text-xs text-foreground/60">
										{needModifierHint
											? "需搭配 Ctrl / Alt 等修饰键"
											: "按下新的按键组合"}
									</span>
								) : binding ? (
									bindingToParts(binding).map((part) => (
										<Kbd
											key={part}
											className={cn(
												isConflict &&
													"border-destructive/40 text-destructive",
											)}
										>
											{part}
										</Kbd>
									))
								) : (
									<span className="text-xs text-foreground/45">未设置</span>
								)}
							</button>
						</div>
					</SettingsExpandarDetail>
				);
			})}

			<SettingsExpandarDetail desc="录制时按 Esc 取消，按 Backspace 清除当前快捷键">
				<Button
					variant="winui"
          size="sm"
					onPointerDown={(e) => e.stopPropagation()}
					onClick={() => resetShortcuts()}
				>
					恢复默认
				</Button>
			</SettingsExpandarDetail>
		</SettingsExpandar>
	);
}
