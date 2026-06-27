import { Color20Regular, Window20Regular } from "@fluentui/react-icons";
import { toast } from "sonner";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type AppearanceSettings,
	useSettingStore,
} from "@/lib/store/settingStore/settingStore";

export function AppearanceSettingCard() {
	const theme = useSettingStore((s) => s.appearance.theme);
	const setTheme = useSettingStore((s) => s.setTheme);
	const material = useSettingStore((s) => s.appearance.material);
	const setMaterial = useSettingStore((s) => s.setMaterial);

	const themeStr =
		theme === "system" ? "跟随系统" : theme === "light" ? "浅色" : "深色";

	return (
		<div className="flex flex-col gap-2">
			<SettingsExpandar
				title="主题"
				subtitle="选择 Yee Music 的显示主题"
				icon={<Color20Regular />}
				trailing={
					<span className="text-muted-foreground text-sm">{themeStr}</span>
				}
			>
				<div className="flex flex-col gap-0">
					<SettingsExpandarDetail>
						<div className="w-full flex flex-col items-start">
							<RadioGroup
								defaultValue={theme}
								onValueChange={(val) => {
									if (material === "mica") {
										toast.info(
											"由于系统限制，Mica 材质需匹配系统主题。如显示异常请调整系统主题设置。",
											{ position: "top-right" },
										);
									}
									setTheme(val as AppearanceSettings["theme"]);
								}}
							>
								<div className="flex gap-2 items-center">
									<RadioGroupItem value="light" />
									<span>浅色</span>
								</div>
								<div className="flex gap-2 items-center">
									<RadioGroupItem value="dark" />
									<span>深色</span>
								</div>
								<div className="flex gap-2 items-center">
									<RadioGroupItem value="system" />
									<span>跟随系统</span>
								</div>
							</RadioGroup>
						</div>
					</SettingsExpandarDetail>
				</div>
			</SettingsExpandar>

			<SettingsExpandar
				title="材质"
				subtitle="选择 Yee Music 的窗口材质"
				icon={<Window20Regular />}
				trailing={
					<Select
						value={material}
						onValueChange={(value) => {
							if (value === "mica") {
								toast.info(
									"由于系统限制，Mica 材质需匹配系统主题。如显示异常请调整系统主题设置。",
									{ position: "top-right" },
								);
							}
							setMaterial(value as AppearanceSettings["material"]);
						}}
					>
						<SelectTrigger className="w-32">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="acrylic">acrylic</SelectItem>
							<SelectItem value="mica">mica</SelectItem>
							<SelectItem value="none">none</SelectItem>
						</SelectContent>
					</Select>
				}
			/>
		</div>
	);
}
