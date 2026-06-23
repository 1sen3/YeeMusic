import SettingsExpandar from "@/components/settings/SettingsExpandar";

import { QUALITY_BY_KEY, QUALITY_LIST } from "@/lib/constants/song";
import { ChevronDown24Regular, Speaker220Regular } from "@fluentui/react-icons";
import { Popover, PopoverItem } from "@/components/yee-popover";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { YeeButton } from "@/components/yee-button";

export function AudioSettingCard() {
	const preferQuality = useSettingStore((s) => s.audio.preferQuality);
	const setPreferQuality = useSettingStore((s) => s.setPreferQuality);

	return (
		<div className="flex flex-col gap-1">
			<SettingsExpandar
				title="音频质量"
				subtitle="选择优先播放的音质"
				icon={<Speaker220Regular />}
				trailing={
					<Popover
						trigger={
							<YeeButton variant="default">
								<span>{QUALITY_BY_KEY[preferQuality].desc}</span>
								<ChevronDown24Regular />
							</YeeButton>
						}
						className="-left-2"
					>
						{QUALITY_LIST.filter(
							(q) => q.desc !== "UNLOCK" && q.desc !== "本地",
						).map((q) => (
							<PopoverItem
								key={q.key}
								isActive={preferQuality === q.key}
								onClick={() => setPreferQuality(q.key)}
							>
								{q.desc}
							</PopoverItem>
						))}
					</Popover>
				}
			></SettingsExpandar>
		</div>
	);
}
