import SettingsExpandar from "@/components/settings/SettingsExpandar";
import { Button } from "@/components/ui/button";

import { QUALITY_BY_KEY, QUALITY_LIST } from "@/lib/constants/song";
import { ChevronDown24Regular, Speaker220Regular } from "@fluentui/react-icons";
import { Popover, PopoverItem } from "@/components/yee-popover";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";

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
              <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0">
                <span>{QUALITY_BY_KEY[preferQuality].desc}</span>
                <ChevronDown24Regular />
              </Button>
            }
            className="-left-2"
          >
            {QUALITY_LIST.filter(
              (q) => q.desc !== "UNLOCK" && q.desc !== "本地音乐",
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
