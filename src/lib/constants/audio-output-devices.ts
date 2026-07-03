import {
	sfAirplayAudio,
	sfAirpods,
	sfAirpodsGen3,
	sfAirpodsGen4,
	sfAirpodsMax,
	sfAirpodsPro,
	sfBeatsEarphones,
	sfBeatsFitpro,
	sfBeatsHeadphones,
	sfBeatsPowerbeats,
	sfBeatsPowerbeats3,
	sfBeatsPowerbeatsPro,
	sfBeatsPowerbeatsPro2,
	sfBeatsSolobuds,
	sfBeatsStudiobuds,
	sfBeatsStudiobudsPlus,
	sfEarbuds,
	sfEarbudsInEar,
	sfEarbudsStemless,
	sfEarpods,
	sfHeadphones,
	sfHeadphonesOverEar,
	sfHeadset,
	sfHomepod,
	sfHomepodMini,
} from "@bradleyhodges/sfsymbols";

export const DEFAULT_AUDIO_OUTPUT_DEVICE_ID = "default";
export const DEFAULT_AUDIO_OUTPUT_DEVICE_NAME = "系统默认";
export const DEFAULT_AUDIO_OUTPUT_DEVICE_ICON_KEY = "sfAirplayAudio";

export type AudioOutputDeviceIcon = typeof sfAirplayAudio;

export interface AudioOutputDeviceIconEntry {
	key: string;
	label: string;
	icon: AudioOutputDeviceIcon;
}

export const AUDIO_OUTPUT_DEVICE_ICONS = [
	{ key: "sfAirplayAudio", label: "AirPlay", icon: sfAirplayAudio },
	{ key: "sfAirpods", label: "AirPods", icon: sfAirpods },
	{ key: "sfAirpodsGen3", label: "AirPods 3", icon: sfAirpodsGen3 },
	{ key: "sfAirpodsGen4", label: "AirPods 4", icon: sfAirpodsGen4 },
	{ key: "sfAirpodsMax", label: "AirPods Max", icon: sfAirpodsMax },
	{ key: "sfAirpodsPro", label: "AirPods Pro", icon: sfAirpodsPro },
	{ key: "sfBeatsEarphones", label: "Beats Earphones", icon: sfBeatsEarphones },
	{ key: "sfBeatsFitpro", label: "Beats Fit Pro", icon: sfBeatsFitpro },
	{ key: "sfBeatsHeadphones", label: "Beats Headphones", icon: sfBeatsHeadphones },
	{ key: "sfBeatsPowerbeats", label: "Powerbeats", icon: sfBeatsPowerbeats },
	{ key: "sfBeatsPowerbeats3", label: "Powerbeats 3", icon: sfBeatsPowerbeats3 },
	{
		key: "sfBeatsPowerbeatsPro",
		label: "Powerbeats Pro",
		icon: sfBeatsPowerbeatsPro,
	},
	{
		key: "sfBeatsPowerbeatsPro2",
		label: "Powerbeats Pro 2",
		icon: sfBeatsPowerbeatsPro2,
	},
	{ key: "sfBeatsSolobuds", label: "Beats Solo Buds", icon: sfBeatsSolobuds },
	{
		key: "sfBeatsStudiobuds",
		label: "Beats Studio Buds",
		icon: sfBeatsStudiobuds,
	},
	{
		key: "sfBeatsStudiobudsPlus",
		label: "Beats Studio Buds +",
		icon: sfBeatsStudiobudsPlus,
	},
	{ key: "sfEarbuds", label: "Earbuds", icon: sfEarbuds },
	{ key: "sfEarbudsInEar", label: "In-ear Earbuds", icon: sfEarbudsInEar },
	{
		key: "sfEarbudsStemless",
		label: "Stemless Earbuds",
		icon: sfEarbudsStemless,
	},
	{ key: "sfEarpods", label: "EarPods", icon: sfEarpods },
	{ key: "sfHeadphones", label: "Headphones", icon: sfHeadphones },
	{
		key: "sfHeadphonesOverEar",
		label: "Over-ear Headphones",
		icon: sfHeadphonesOverEar,
	},
	{ key: "sfHeadset", label: "Headset", icon: sfHeadset },
	{ key: "sfHomepod", label: "HomePod", icon: sfHomepod },
	{ key: "sfHomepodMini", label: "HomePod mini", icon: sfHomepodMini },
] as const satisfies readonly AudioOutputDeviceIconEntry[];

export function getAudioOutputDeviceIconEntry(iconKey?: string | null) {
	return (
		AUDIO_OUTPUT_DEVICE_ICONS.find((entry) => entry.key === iconKey) ??
		AUDIO_OUTPUT_DEVICE_ICONS[0]
	);
}

export function getAudioOutputDeviceIcon(iconKey?: string | null) {
	return getAudioOutputDeviceIconEntry(iconKey).icon;
}
