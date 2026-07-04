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
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail
          desc="开发者：isen"
          trailing={
            <a
              className="text-sm text-foreground/60 hover:bg-foreground/5 px-2 py-1 rounded-sm transition-all duration-300"
              href="mailto:yiisen.shu@gmail.com"
            >
              yiisen.shu@gmail.com
            </a>
          }
        />
        <SettingsExpandarDetail
          desc="问题反馈"
          trailing={
            <div className="hover:bg-foreground/5 p-2 rounded-sm transition-all duration-300">
              <IconBrandGithub
                className="size-4 text-foreground "
                onClick={async () =>
                  await openUrl("https://github.com/1sen3/YeeMusicTauri")
                }
              />
            </div>
          }
        />
      </div>
    </SettingsExpandar>
  );
}
