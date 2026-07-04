import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	DEFAULT_AUDIO_OUTPUT_DEVICE_ID,
	DEFAULT_AUDIO_OUTPUT_DEVICE_NAME,
	getAudioOutputDeviceIcon,
	getAudioOutputDeviceIconEntry,
	type AudioOutputDeviceIcon,
} from "@/lib/constants/audio-output-devices";
import { type AudioDeviceInfo, corePlayer } from "@/lib/player/corePlayer";
import {
	type OutputDeviceProfile,
	useSettingStore,
} from "@/lib/store/settingStore/settingStore";

export const DEFAULT_AUDIO_OUTPUT_DEVICE: AudioDeviceInfo = {
	id: DEFAULT_AUDIO_OUTPUT_DEVICE_ID,
	name: DEFAULT_AUDIO_OUTPUT_DEVICE_NAME,
	isDefault: true,
};

interface UseAudioOutputDevicesOptions {
	autoRefresh?: boolean;
	onRefreshError?: (error: unknown) => void;
}

export interface AudioOutputDeviceWithProfile {
	id: string;
	device: AudioDeviceInfo;
	profile: OutputDeviceProfile;
	displayName: string;
	iconKey: string;
	icon: AudioOutputDeviceIcon;
	isSelected: boolean;
}

export interface SelectedAudioOutputDevice {
	id: string;
	profile: OutputDeviceProfile;
	displayName: string;
	iconKey: string;
	icon: AudioOutputDeviceIcon;
	isAvailable: boolean;
	availableDevice: AudioOutputDeviceWithProfile | null;
}

export function useAudioOutputDevices({
	autoRefresh = true,
	onRefreshError,
}: UseAudioOutputDevicesOptions = {}) {
	const audio = useSettingStore((state) => state.audio);
	const upsertOutputDeviceProfiles = useSettingStore(
		(state) => state.upsertOutputDeviceProfiles,
	);
	const updateOutputDeviceProfile = useSettingStore(
		(state) => state.updateOutputDeviceProfile,
	);
	const setLyricSheetOutputDeviceLabelVisible = useSettingStore(
		(state) => state.setLyricSheetOutputDeviceLabelVisible,
	);
	const updateAudioEngine = useSettingStore((state) => state.updateAudioEngine);
	const [devices, setDevices] = useState<AudioDeviceInfo[]>([]);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [hasLoadedDevices, setHasLoadedDevices] = useState(false);
	const onRefreshErrorRef = useRef(onRefreshError);

	useEffect(() => {
		onRefreshErrorRef.current = onRefreshError;
	}, [onRefreshError]);

	const availableDevices = useMemo(
		() => mergeOutputDevices(devices),
		[devices],
	);
	const selectedDeviceId =
		audio.outputDeviceId ?? DEFAULT_AUDIO_OUTPUT_DEVICE_ID;

	const refreshDevices = useCallback(async () => {
		setIsRefreshing(true);
		try {
			const listedDevices = await corePlayer.listOutputDevices();
			const nextAvailableDevices = mergeOutputDevices(listedDevices);
			setDevices(listedDevices);
			await upsertOutputDeviceProfiles(nextAvailableDevices);
			setHasLoadedDevices(true);
			return nextAvailableDevices;
		} finally {
			setIsRefreshing(false);
		}
	}, [upsertOutputDeviceProfiles]);

	useEffect(() => {
		if (!autoRefresh) return;

		void refreshDevices().catch((error) => {
			onRefreshErrorRef.current?.(error);
		});
	}, [autoRefresh, refreshDevices]);

	const availableDevicesWithProfiles = useMemo(
		() =>
			availableDevices.map((device) =>
				createDeviceWithProfile(
					device,
					audio.outputDeviceProfiles[device.id],
					selectedDeviceId,
				),
			),
		[availableDevices, audio.outputDeviceProfiles, selectedDeviceId],
	);

	const selectedDevice = useMemo<SelectedAudioOutputDevice>(() => {
		const availableDevice =
			availableDevicesWithProfiles.find(
				(device) => device.id === selectedDeviceId,
			) ?? null;
		const selectedProfile =
			audio.outputDeviceProfiles[selectedDeviceId] ??
			createFallbackProfile(selectedDeviceId);
		const profile = availableDevice?.profile ?? selectedProfile;
		const displayName = resolveOutputDeviceDisplayName(
			profile,
			availableDevice?.device,
		);
		const iconKey = resolveOutputDeviceIconKey(profile.iconKey);

		return {
			id: selectedDeviceId,
			profile,
			displayName,
			iconKey,
			icon: getAudioOutputDeviceIcon(iconKey),
			isAvailable: Boolean(availableDevice),
			availableDevice,
		};
	}, [
		availableDevicesWithProfiles,
		audio.outputDeviceProfiles,
		selectedDeviceId,
	]);

	const selectOutputDevice = useCallback(
		async (deviceId: string) => {
			await updateAudioEngine(
				{
					outputDeviceId:
						deviceId === DEFAULT_AUDIO_OUTPUT_DEVICE_ID ? null : deviceId,
				},
				{ throwOnApplyError: true },
			);
		},
		[updateAudioEngine],
	);

	const setDeviceDisplayName = useCallback(
		(deviceId: string, displayName: string) =>
			updateOutputDeviceProfile(deviceId, { displayName }),
		[updateOutputDeviceProfile],
	);

	const setDeviceIconKey = useCallback(
		(deviceId: string, iconKey: string | undefined) =>
			updateOutputDeviceProfile(deviceId, { iconKey }),
		[updateOutputDeviceProfile],
	);

	return {
		availableDevices: availableDevicesWithProfiles,
		selectedDevice,
		selectedDeviceId,
		lyricSheetOutputDeviceLabelVisible:
			audio.lyricSheetOutputDeviceLabelVisible,
		isRefreshing,
		hasLoadedDevices,
		refreshDevices,
		selectOutputDevice,
		updateOutputDeviceProfile,
		setDeviceDisplayName,
		setDeviceIconKey,
		setLyricSheetOutputDeviceLabelVisible,
	};
}

export function mergeOutputDevices(devices: AudioDeviceInfo[]) {
	const merged = new Map<string, AudioDeviceInfo>();
	merged.set(DEFAULT_AUDIO_OUTPUT_DEVICE_ID, DEFAULT_AUDIO_OUTPUT_DEVICE);
	for (const device of devices) {
		if (!device.id) continue;
		merged.set(device.id, {
			...device,
			isDefault:
				device.id === DEFAULT_AUDIO_OUTPUT_DEVICE_ID ? true : device.isDefault,
		});
	}
	return Array.from(merged.values());
}

export function resolveOutputDeviceDisplayName(
	profile: OutputDeviceProfile,
	device?: AudioDeviceInfo,
) {
	return (
		profile.displayName?.trim() ||
		device?.name ||
		profile.lastKnownName ||
		getFallbackDeviceName(profile.id)
	);
}

export function resolveOutputDeviceIconKey(iconKey?: string | null) {
	return getAudioOutputDeviceIconEntry(iconKey).key;
}

function createDeviceWithProfile(
	device: AudioDeviceInfo,
	profile: OutputDeviceProfile | undefined,
	selectedDeviceId: string,
): AudioOutputDeviceWithProfile {
	const nextProfile = profile ?? createFallbackProfile(device.id, device.name);
	const iconKey = resolveOutputDeviceIconKey(nextProfile.iconKey);

	return {
		id: device.id,
		device,
		profile: nextProfile,
		displayName: resolveOutputDeviceDisplayName(nextProfile, device),
		iconKey,
		icon: getAudioOutputDeviceIcon(iconKey),
		isSelected: device.id === selectedDeviceId,
	};
}

function createFallbackProfile(
	id: string,
	lastKnownName = getFallbackDeviceName(id),
): OutputDeviceProfile {
	return {
		id,
		lastKnownName,
		firstSeenAt: 0,
		lastSeenAt: 0,
	};
}

function getFallbackDeviceName(id: string) {
	return id === DEFAULT_AUDIO_OUTPUT_DEVICE_ID
		? DEFAULT_AUDIO_OUTPUT_DEVICE_NAME
		: id || DEFAULT_AUDIO_OUTPUT_DEVICE_NAME;
}
