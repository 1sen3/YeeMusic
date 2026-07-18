import { AboutSettingCard } from "@/components/settings/About/AboutSettingCard";
import { UpdateSettingCard } from "@/components/settings/About/UpdateSettingCard";
import { AppearanceSettingCard } from "@/components/settings/AppearanceSettings/AppearanceSettingCard";
import { FontSettingCard } from "@/components/settings/AppearanceSettings/FontSettingCard";
import { AudioCacheCard } from "@/components/settings/AudioSettings/AudioCacheCard";
import { AudioEngineCard } from "@/components/settings/AudioSettings/AudioEngineCard";
import { AudioSettingCard } from "@/components/settings/AudioSettings/AudioSettingCard";
import { DownloadSettingCard } from "@/components/settings/AudioSettings/DownloadSettignCard";
import { MusicFolderSettingCard } from "@/components/settings/AudioSettings/MusicFolderSettingCard";
import { ApiSettingCard } from "@/components/settings/NetworkSettings/ApiSettingCard";
import { ShortcutSettingCard } from "@/components/settings/ShortcutSettings/ShortcutSettingCard";

export default function SettingPage() {
	return (
		<div className="flex h-full w-full flex-col gap-8 px-8 py-8">
			<div className="flex h-full w-full flex-col gap-3">
				<h2 className="text-sm font-medium text-foreground/88">音频与下载</h2>

				<div className="flex flex-col gap-2">
					<AudioSettingCard />
					<AudioEngineCard />
					<MusicFolderSettingCard />
					<DownloadSettingCard />
					<AudioCacheCard />
				</div>
			</div>

			<div className="flex h-full w-full flex-col gap-3">
				<h2 className="text-sm font-medium text-foreground/88">个性化</h2>

				<div className="flex flex-col gap-2">
					<AppearanceSettingCard />
					<FontSettingCard />
				</div>
			</div>

			<div className="flex h-full w-full flex-col gap-3">
				<h2 className="text-sm font-medium text-foreground/88">快捷键</h2>

				<div className="flex flex-col gap-2">
					<ShortcutSettingCard />
				</div>
			</div>

			<div className="flex h-full w-full flex-col gap-3">
				<h2 className="text-sm font-medium text-foreground/88">网络</h2>

				<div className="flex flex-col gap-2">
					<ApiSettingCard />
				</div>
			</div>

			<div className="flex h-full w-full flex-col gap-3">
				<h2 className="text-sm font-medium text-foreground/88">关于</h2>
				<div className="flex flex-col gap-2">
					<AboutSettingCard />
					<UpdateSettingCard />
				</div>
			</div>
		</div>
	);
}
