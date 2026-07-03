import { Speaker220Regular } from "@fluentui/react-icons";
import SettingsExpandar from "@/components/settings/SettingsExpandar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QualityKey } from "@/lib/constants/song";
import { QUALITY_BY_KEY, QUALITY_LIST } from "@/lib/constants/song";
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
          <Select
            value={preferQuality}
            onValueChange={(value) => setPreferQuality(value as QualityKey)}
          >
            <SelectTrigger className="w-32">
              <SelectValue>{QUALITY_BY_KEY[preferQuality].desc}</SelectValue>
            </SelectTrigger>
            <SelectContent
              position="popper"
              align="end"
              sideOffset={4}
              collisionPadding={8}
            >
              {QUALITY_LIST.filter(
                (q) => q.key !== "unlock" && q.key !== "local",
              ).map((q) => (
                <SelectItem key={q.key} value={q.key}>
                  {q.desc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
