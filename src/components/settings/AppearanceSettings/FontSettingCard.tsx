import { TextFont20Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";

export function FontSettingCard() {
	const fontSettings = useSettingStore((s) => s.appearance.font);
	const updateFont = useSettingStore((s) => s.updateFont);

	const [interfaceFont, setInterfaceFont] = useState(
		fontSettings.interfaceFontStr,
	);
	const [lyricFont, setLyricFont] = useState(fontSettings.lyricFontStr);

	useEffect(() => {
		setInterfaceFont(fontSettings.interfaceFontStr);
	}, [fontSettings.interfaceFontStr]);

	useEffect(() => {
		setLyricFont(fontSettings.lyricFontStr);
	}, [fontSettings.lyricFontStr]);

	return (
		<SettingsExpandar
			icon={<TextFont20Regular />}
			title="字体"
			subtitle="配置界面和歌词页字体"
		>
			<SettingsExpandarDetail desc="界面字体">
				<Input
					className="w-60 bg-card"
					value={interfaceFont}
					placeholder={"例如：'PingFang UI', 'Google Sans'"}
					onChange={(e) => setInterfaceFont(e.target.value)}
					onBlur={() => updateFont({ interfaceFontStr: interfaceFont })}
				/>
			</SettingsExpandarDetail>
			<SettingsExpandarDetail desc="歌词字体">
				<Input
					className="w-60 bg-card"
					value={lyricFont}
					placeholder={"例如：'PingFang UI', 'Google Sans'"}
					onChange={(e) => setLyricFont(e.target.value)}
					onBlur={() => updateFont({ lyricFontStr: lyricFont })}
				/>
			</SettingsExpandarDetail>
			<SettingsExpandarDetail desc="歌词字重">
				<NumberStepper
					label="歌词字重"
					value={fontSettings.lyricFontWeight}
					min={100}
					max={900}
					step={100}
					onValueChange={(lyricFontWeight) => updateFont({ lyricFontWeight })}
				/>
			</SettingsExpandarDetail>
			<SettingsExpandarDetail desc="歌词字号">
				<NumberStepper
					label="歌词字号"
					value={fontSettings.lyricFontSize}
					min={16}
					max={72}
					step={1}
					onValueChange={(lyricFontSize) => updateFont({ lyricFontSize })}
				/>
			</SettingsExpandarDetail>
		</SettingsExpandar>
	);
}
