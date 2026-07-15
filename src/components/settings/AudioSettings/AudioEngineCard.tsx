import SFIcon from "@bradleyhodges/sfsymbols-react";
import { SpeakerSettings20Regular } from "@fluentui/react-icons";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type AudioOutputDeviceWithProfile,
	resolveOutputDeviceIconKey,
	useAudioOutputDevices,
} from "@/hooks/use-audio-output-devices";
import {
	AUDIO_OUTPUT_DEVICE_ICONS,
	type AudioOutputDeviceIconEntry,
	DEFAULT_AUDIO_OUTPUT_DEVICE_ICON_KEY,
} from "@/lib/constants/audio-output-devices";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { cn } from "@/lib/utils";

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
	const outputDevices = useAudioOutputDevices({
		onRefreshError: (error) => {
			console.error("[AudioEngineCard] list output devices failed:", error);
			toast.error("无法读取输出设备");
		},
	});
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

	const equalizerLabel = audio.equalizerEnabled ? "开" : "关";
	return (
		<div className="flex flex-col gap-1">
			<SettingsExpandar
				title="播放引擎"
				subtitle="输出、响度、均衡与过渡"
				icon={<SpeakerSettings20Regular />}
			>
				<div className="flex flex-col gap-0">
					<SettingsExpandarDetail
						desc="输出设备管理"
						trailing={
							<Dialog>
								<DialogTrigger asChild>
									<Button
										variant="winui"
										className="w-64 justify-start overflow-hidden"
									>
										<SFIcon
											icon={outputDevices.selectedDevice.icon}
											className="size-4 shrink-0"
										/>
										<span className="truncate">
											{outputDevices.selectedDevice.displayName}
										</span>
										{outputDevices.hasLoadedDevices &&
											!outputDevices.isRefreshing &&
											!outputDevices.selectedDevice.isAvailable && (
												<span className="ml-auto shrink-0 text-xs text-muted-foreground">
													不可用
												</span>
											)}
									</Button>
								</DialogTrigger>
								<OutputDeviceDialog outputDevices={outputDevices} />
							</Dialog>
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

					<SettingsExpandarDetail
						desc="前置放大"
						trailing={
							<div className="flex items-center gap-2">
								<NumberStepper
									label="前置放大"
									value={preampDb}
									min={-12}
									max={12}
									step={0.5}
									onValueChange={(value) => {
										setPreampDb(value);
										void updateAudioEngine({ replayGainPreampDb: value });
									}}
								/>
								<span className="w-5 text-sm text-muted-foreground">dB</span>
							</div>
						}
					/>

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

					<SettingsExpandarDetail
						desc="交叉淡化"
						trailing={
							<div className="flex items-center gap-2">
								<NumberStepper
									label="交叉淡化"
									value={crossfadeDuration}
									min={0}
									max={12}
									step={0.5}
									onValueChange={(value) => {
										setCrossfadeDuration(value);
										void updateAudioEngine({ crossfadeDuration: value });
									}}
								/>
								<span className="w-5 text-sm text-muted-foreground">s</span>
							</div>
						}
					/>
				</div>
			</SettingsExpandar>
		</div>
	);
}

type AudioOutputDeviceManager = ReturnType<typeof useAudioOutputDevices>;

function OutputDeviceDialog({
	outputDevices,
}: {
	outputDevices: AudioOutputDeviceManager;
}) {
	const {
		availableDevices,
		selectedDevice,
		selectedDeviceId,
		lyricSheetOutputDeviceLabelVisible,
		isRefreshing,
		refreshDevices,
		selectOutputDevice,
		setDeviceDisplayName,
		setDeviceIconKey,
		setLyricSheetOutputDeviceLabelVisible,
	} = outputDevices;
	const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
	const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);

	useEffect(() => {
		setEditingDeviceId((current) => {
			if (current && availableDevices.some((device) => device.id === current)) {
				return current;
			}
			return (
				selectedDevice.availableDevice?.id ?? availableDevices[0]?.id ?? null
			);
		});
	}, [availableDevices, selectedDevice.availableDevice?.id]);

	const editingDevice =
		availableDevices.find((device) => device.id === editingDeviceId) ??
		selectedDevice.availableDevice ??
		availableDevices[0] ??
		null;
	const isSwitchingDevice = pendingDeviceId !== null;

	async function handleRefreshDevices() {
		try {
			await refreshDevices();
		} catch (error) {
			console.error("[AudioEngineCard] refresh output devices failed:", error);
			toast.error("无法刷新输出设备");
		}
	}

	async function handleSelectDevice(deviceId: string) {
		setEditingDeviceId(deviceId);
		if (deviceId === selectedDeviceId || isSwitchingDevice) return;

		setPendingDeviceId(deviceId);
		try {
			await selectOutputDevice(deviceId);
		} catch (error) {
			console.error("[AudioEngineCard] update output device failed:", error);
			toast.error("无法切换输出设备");
		} finally {
			setPendingDeviceId(null);
		}
	}

	async function handleLyricSheetLabelVisibleChange(visible: boolean) {
		try {
			await setLyricSheetOutputDeviceLabelVisible(visible);
		} catch (error) {
			console.error(
				"[AudioEngineCard] update lyric sheet output device label visibility failed:",
				error,
			);
			toast.error("无法保存设备标签显示设置");
		}
	}

	return (
		<DialogContent className="gap-0 p-0 sm:max-w-[760px]">
			<div className="flex items-center justify-between px-6 pt-6">
				<DialogTitle className="p-0 text-lg">输出设备管理</DialogTitle>
				<Button
					type="button"
					variant="winui"
					disabled={isRefreshing}
					onClick={() => void handleRefreshDevices()}
				>
					<RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
					刷新
				</Button>
			</div>

			<DialogBody className="grid gap-5 px-6 pt-6 pb-6 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
				<div className="min-h-[430px] overflow-y-auto rounded-sm border bg-card/30 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
					<div className="flex flex-col gap-1 p-2">
						{availableDevices.map((device) => (
							<button
								key={device.id}
								type="button"
								disabled={isSwitchingDevice}
								className={cn(
									"relative flex min-h-16 w-full items-center gap-3 rounded-sm border border-transparent px-3 py-2 text-left transition-colors",
									"hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-60",
									device.id === editingDevice?.id && "bg-foreground/5",
									device.isSelected && " text-primary",
									device.isSelected &&
										"after:w-1 after:h-8 after:rounded-full after:bg-primary after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2",
								)}
								onClick={() => void handleSelectDevice(device.id)}
							>
								<div className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-background/70">
									<SFIcon icon={device.icon} className="size-5" />
								</div>
								<div className="min-w-0 flex-1">
									<div className="truncate text-sm font-medium">
										{device.displayName}
									</div>
									<div className="truncate text-xs text-muted-foreground">
										{device.profile.displayName
											? device.device.name
											: device.profile.lastKnownName}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>

				{editingDevice && (
					<div className="flex min-h-[430px] flex-col gap-5 rounded-sm border bg-card/30 p-4">
						<div className="flex items-center gap-3">
							<div className="flex size-11 shrink-0 items-center justify-center rounded-sm bg-background/70 text-primary">
								<SFIcon icon={editingDevice.icon} className="size-6" />
							</div>
							<div className="min-w-0">
								<div className="truncate text-sm font-semibold">
									{editingDevice.displayName}
								</div>
								<div className="truncate text-xs text-muted-foreground">
									{editingDevice.device.name}
								</div>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-xs font-medium text-muted-foreground">
								显示名称
							</span>
							<OutputDeviceNameInput
								device={editingDevice}
								onCommit={setDeviceDisplayName}
							/>
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-xs font-medium text-muted-foreground">
								图标
							</span>
							<OutputDeviceIconPicker
								device={editingDevice}
								onChange={setDeviceIconKey}
							/>
						</div>

						<div className="mt-auto flex items-center justify-between gap-4 border-t pt-4">
							<div className="min-w-0">
								<div className="text-sm font-medium">歌词页显示设备名称</div>
							</div>
							<Switch
								checked={lyricSheetOutputDeviceLabelVisible}
								onCheckedChange={(checked) =>
									void handleLyricSheetLabelVisibleChange(checked)
								}
							/>
						</div>
					</div>
				)}
			</DialogBody>

			<DialogFooter className="mx-0 mb-0 justify-end px-6">
				<DialogCancel className="max-w-60">关闭</DialogCancel>
			</DialogFooter>
		</DialogContent>
	);
}

function OutputDeviceNameInput({
	device,
	onCommit,
}: {
	device: AudioOutputDeviceWithProfile;
	onCommit: (deviceId: string, displayName: string) => Promise<void>;
}) {
	const [value, setValue] = useState(device.profile.displayName ?? "");

	useEffect(() => {
		setValue(device.profile.displayName ?? "");
	}, [device.profile.displayName]);

	async function commitName() {
		const nextValue = value.trim();
		if (nextValue === (device.profile.displayName ?? "")) return;

		try {
			await onCommit(device.id, nextValue);
			setValue(nextValue);
		} catch (error) {
			console.error(
				"[AudioEngineCard] update output device name failed:",
				error,
			);
			toast.error("无法保存设备名称");
		}
	}

	return (
		<Input
			value={value}
			placeholder={device.device.name || device.profile.lastKnownName}
			onChange={(event) => setValue(event.target.value)}
			onBlur={() => void commitName()}
			onKeyDown={(event) => {
				if (event.key === "Enter") event.currentTarget.blur();
			}}
		/>
	);
}

function OutputDeviceIconPicker({
	device,
	onChange,
}: {
	device: AudioOutputDeviceWithProfile;
	onChange: (deviceId: string, iconKey: string | undefined) => Promise<void>;
}) {
	const selectedIconKey = resolveOutputDeviceIconKey(device.profile.iconKey);

	async function handleIconChange(iconKey: string) {
		try {
			await onChange(
				device.id,
				iconKey === DEFAULT_AUDIO_OUTPUT_DEVICE_ICON_KEY ? undefined : iconKey,
			);
		} catch (error) {
			console.error(
				"[AudioEngineCard] update output device icon failed:",
				error,
			);
			toast.error("无法保存设备图标");
		}
	}

	return (
		<div className="grid grid-cols-6 gap-2">
			{AUDIO_OUTPUT_DEVICE_ICONS.map((entry) => (
				<OutputDeviceIconButton
					key={entry.key}
					entry={entry}
					selected={entry.key === selectedIconKey}
					onSelect={() => void handleIconChange(entry.key)}
				/>
			))}
		</div>
	);
}

function OutputDeviceIconButton({
	entry,
	selected,
	onSelect,
}: {
	entry: AudioOutputDeviceIconEntry;
	selected: boolean;
	onSelect: () => void;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<button
					type="button"
					aria-label={entry.label}
					aria-pressed={selected}
					className={cn(
						"flex size-10 items-center justify-center rounded-sm border bg-background/70 text-foreground transition-colors hover:bg-foreground/5",
						selected && "border-primary border-2 text-primary",
					)}
					onClick={onSelect}
				>
					<SFIcon icon={entry.icon} className="size-5" />
				</button>
			</TooltipTrigger>
			<TooltipContent sideOffset={6}>{entry.label}</TooltipContent>
		</Tooltip>
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
