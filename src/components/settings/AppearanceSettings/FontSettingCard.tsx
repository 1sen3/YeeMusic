import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";

import { TextFont20Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { useEffect } from "react";
import { Input } from "@/components/ui/input";

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
			subtitle="配置 Yee Music 的字体"
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
		</SettingsExpandar>
	);
}
