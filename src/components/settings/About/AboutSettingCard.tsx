import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { IconBrandGithub } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";
export function AboutSettingCard() {
	return (
		<SettingsExpandar
			title="Yee Music"
			subtitle="更好用的网易云音乐客户端"
			icon={
				<img src={"/icons/logo.png"} className="object-cover" alt="Yee Music" />
			}
		>
			{" "}
			<div className="flex flex-col gap-0">
				{" "}
				<SettingsExpandarDetail desc="作者：isen" />{" "}
				<SettingsExpandarDetail
					desc="问题反馈"
					trailing={
						<IconBrandGithub
							className="size-4 hover:text-muted-foreground text-foreground "
							onClick={async () =>
								await openUrl("https://github.com/1sen3/YeeMusicTauri")
							}
						/>
					}
				/>{" "}
			</div>{" "}
		</SettingsExpandar>
	);
}
