import { Speaker220Regular } from "@fluentui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { type AudioDeviceInfo, corePlayer } from "@/lib/player/corePlayer";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";

const EQ_BANDS = ["60 Hz", "230 Hz", "910 Hz", "3.6 kHz", "14 kHz"];
const EQ_PRESETS = [
	{ id: "flat", label: "平直", gains: [0, 0, 0, 0, 0] },
	{ id: "bass", label: "低音增强", gains: [6, 4, 1, 0, 0] },
	{ id: "treble", label: "高音增强", gains: [0, 0, 1, 4, 6] },
	{ id: "vocal", label: "人声", gains: [-2, 0, 4, 3, -1] },
	{ id: "rock", label: "摇滚", gains: [4, 2, -2, 3, 5] },
];

export function AudioEngineCard() {
	const audio = useSettingStore((s) => s.audio);
	const updateAudioEngine = useSettingStore((s) => s.updateAudioEngine);
	const [devices, setDevices] = useState<AudioDeviceInfo[]>([]);
	const [preampDb, setPreampDb] = useState(audio.replayGainPreampDb);
	const [crossfadeDuration, setCrossfadeDuration] = useState(
		audio.crossfadeDuration,
	);
	const [eqGains, setEqGains] = useState(audio.equalizerGainsDb);

	useEffect(() => {
		setPreampDb(audio.replayGainPreampDb);
	}, [audio.replayGainPreampDb]);

	useEffect(() => {
		setCrossfadeDuration(audio.crossfadeDuration);
	}, [audio.crossfadeDuration]);

	useEffect(() => {
		setEqGains(normalizeEqGains(audio.equalizerGainsDb));
	}, [audio.equalizerGainsDb]);

	useEffect(() => {
		corePlayer
			.listOutputDevices()
			.then(setDevices)
			.catch((error) => {
				console.error("[AudioEngineCard] list output devices failed:", error);
				toast.error("无法读取输出设备");
			});
	}, []);

	const selectedDeviceValue = audio.outputDeviceId ?? "default";
	const equalizerLabel = audio.equalizerEnabled ? "开" : "关";
	const crossfadeLabel = `${crossfadeDuration.toFixed(1)}s`;
	const outputDevices = useMemo(
		() =>
			devices.length > 0
				? devices
				: [{ id: "default", name: "系统默认", isDefault: true }],
		[devices],
	);

	return (
		<div className="flex flex-col gap-1">
			<SettingsExpandar
				title="播放引擎"
				subtitle="输出、响度、均衡与过渡"
				icon={<Speaker220Regular />}
			>
				<div className="flex flex-col gap-0">
					<SettingsExpandarDetail
						desc="输出设备"
						trailing={
							<Select
								value={selectedDeviceValue}
								onValueChange={(value) =>
									updateAudioEngine({
										outputDeviceId: value === "default" ? null : value,
									})
								}
							>
								<SelectTrigger className="w-64">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{outputDevices.map((device) => (
										<SelectItem key={device.id} value={device.id}>
											{device.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						}
					/>

					<SettingsExpandarDetail
						desc="音量均衡"
						trailing={
							<Switch
								checked={audio.replayGainEnabled}
								onCheckedChange={(checked) =>
									updateAudioEngine({ replayGainEnabled: checked })
								}
							/>
						}
					/>

					<SettingsExpandarDetail>
						<SliderRow
							label={`预放大：${preampDb.toFixed(1)} dB`}
							value={preampDb}
							min={-12}
							max={12}
							step={0.5}
							onChange={setPreampDb}
							onCommit={(value) =>
								updateAudioEngine({ replayGainPreampDb: value })
							}
						/>
					</SettingsExpandarDetail>

					<SettingsExpandarDetail
						desc={`均衡器：${equalizerLabel}`}
						trailing={
							<Dialog>
								<DialogTrigger asChild>
									<Button variant="winui">调整</Button>
								</DialogTrigger>
								<EqualizerDialog
									enabled={audio.equalizerEnabled}
									gains={eqGains}
									onEnabledChange={(checked) =>
										updateAudioEngine({ equalizerEnabled: checked })
									}
									onGainsChange={setEqGains}
									onGainsCommit={(next) =>
										updateAudioEngine({ equalizerGainsDb: next })
									}
								/>
							</Dialog>
						}
					/>

					<SettingsExpandarDetail>
						<SliderRow
							label={`交叉淡化：${crossfadeLabel}`}
							value={crossfadeDuration}
							min={0}
							max={12}
							step={0.5}
							onChange={setCrossfadeDuration}
							onCommit={(value) =>
								updateAudioEngine({ crossfadeDuration: value })
							}
						/>
					</SettingsExpandarDetail>
				</div>
			</SettingsExpandar>
		</div>
	);
}

function EqualizerDialog({
	enabled,
	gains,
	onEnabledChange,
	onGainsChange,
	onGainsCommit,
}: {
	enabled: boolean;
	gains: number[];
	onEnabledChange: (enabled: boolean) => void;
	onGainsChange: (gains: number[]) => void;
	onGainsCommit: (gains: number[]) => void;
}) {
	const safeGains = normalizeEqGains(gains);
	const currentPreset =
		EQ_PRESETS.find((preset) => isSameGains(preset.gains, safeGains))?.id ??
		"custom";

	const updateGain = (index: number, value: number) => {
		const next = applyEqGain(safeGains, index, value);
		onGainsChange(next);
		return next;
	};

	return (
		<DialogContent className="gap-0 p-0 sm:max-w-[540px]">
			<div className="flex items-center justify-between px-6 pt-6">
				<DialogTitle className="p-0 text-lg">均衡器</DialogTitle>
				<div className="flex items-center gap-3 text-sm">
					<span>{enabled ? "开" : "关"}</span>
					<Switch checked={enabled} onCheckedChange={onEnabledChange} />
				</div>
			</div>

			<DialogBody className="px-6 pt-7 pb-6">
				<div className="flex items-center gap-3">
					<span className="text-sm text-foreground/80">预设</span>
					<Select
						value={currentPreset}
						onValueChange={(value) => {
							const preset = EQ_PRESETS.find((item) => item.id === value);
							if (!preset) return;
							const next = normalizeEqGains(preset.gains);
							onGainsChange(next);
							onGainsCommit(next);
						}}
					>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{currentPreset === "custom" && (
								<SelectItem value="custom">自定义</SelectItem>
							)}
							{EQ_PRESETS.map((preset) => (
								<SelectItem key={preset.id} value={preset.id}>
									{preset.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-5 gap-4 mt-8">
					{EQ_BANDS.map((label, index) => (
						<div key={label} className="flex flex-col gap-4">
							<Slider
								orientation="vertical"
								value={[safeGains[index] ?? 0]}
								min={-12}
								max={12}
								step={1}
								className="h-36"
								onValueChange={([value]) => updateGain(index, value)}
								onValueCommit={([value]) =>
									onGainsCommit(updateGain(index, value))
								}
							/>

							<div className="flex flex-col items-center">
								<span className="whitespace-nowrap text-xs text-foreground/75">
									{label}
								</span>
								<span className="text-xs text-muted-foreground">
									{formatDb(safeGains[index] ?? 0)}
								</span>
							</div>
						</div>
					))}
				</div>
			</DialogBody>

			<DialogFooter className="mx-0 mb-0 justify-end px-6">
				<DialogCancel className="max-w-60">关闭</DialogCancel>
			</DialogFooter>
		</DialogContent>
	);
}

function SliderRow({
	label,
	value,
	min,
	max,
	step,
	onChange,
	onCommit,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	onChange: (value: number) => void;
	onCommit: (value: number) => void;
}) {
	return (
		<div className="flex w-full items-center gap-6">
			<span className="w-36 shrink-0 text-sm text-foreground/60">{label}</span>
			<Slider
				value={[value]}
				min={min}
				max={max}
				step={step}
				onValueChange={([next]) => onChange(next)}
				onValueCommit={([next]) => onCommit(next)}
				className="max-w-md flex-1"
			/>
		</div>
	);
}

function normalizeEqGains(gains: number[]) {
	return Array.from({ length: 5 }, (_, index) =>
		Math.max(-12, Math.min(12, gains[index] ?? 0)),
	);
}

function applyEqGain(gains: number[], index: number, value: number) {
	const next = normalizeEqGains(gains);
	next[index] = clampDb(value);
	return next;
}

function isSameGains(left: number[], right: number[]) {
	return (
		left.length === right.length &&
		left.every((gain, index) => gain === right[index])
	);
}

function clampDb(value: number) {
	return Math.max(-12, Math.min(12, value));
}

function formatDb(value: number) {
	return `${value > 0 ? "+" : ""}${Number.isInteger(value) ? value : value.toFixed(1)} dB`;
}
