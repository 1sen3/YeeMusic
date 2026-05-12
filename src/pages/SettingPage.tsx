import { AudioSettingCard } from "@/components/settings/AudioSettings/AudioSettingCard";
import { DownloadSettingCard } from "@/components/settings/AudioSettings/DownloadSettignCard";
import { AppearanceSettingCard } from "@/components/settings/AppearanceSettings/AppearanceSettingCard";
import { FontSettingCard } from "@/components/settings/AppearanceSettings/FontSettingCard";
import { UpdateSettingCard } from "@/components/settings/About/UpdateSettingCard";
import { AboutSettingCard } from "@/components/settings/About/AboutSettingCard";
import { MusicFolderSettingCard } from "@/components/settings/AudioSettings/MusicFolderSettingCard";

export default function SettingPage() {
  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">音频与下载</h2>

        <div className="flex flex-col gap-2">
          <AudioSettingCard />
          <DownloadSettingCard />
          <MusicFolderSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">个性化</h2>

        <div className="flex flex-col gap-2">
          <AppearanceSettingCard />
          <FontSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">关于</h2>
        <div className="flex flex-col gap-2">
          <AboutSettingCard />
          <UpdateSettingCard />
        </div>
      </div>
    </div>
  );
}
