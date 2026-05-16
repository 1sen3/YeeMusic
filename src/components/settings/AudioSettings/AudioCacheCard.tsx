import SettingsExpandar, {
  SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";

import { DatabaseLightning20Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { formatFileSize } from "@/lib/utils";
import { toast } from "sonner";

export function AudioCacheCard() {
  const maxCacheSize = useSettingStore((s) => s.audio.maxCacheSize);
  const setMaxCacheSize = useSettingStore((s) => s.setMaxCacheSize);
  const [currentCacheBytes, setCurrentCacheBytes] = useState(0);

  const fetchCacheSize = async () => {
    try {
      const sizeBytes = await invoke<number>("get_audio_cache_size");
      setCurrentCacheBytes(sizeBytes);
    } catch (e) {
      console.error("Failed to get cache size", e);
    }
  };

  useEffect(() => {
    fetchCacheSize();
  }, []);

  const handleClearCache = async () => {
    try {
      await invoke("clear_audio_cache");
      toast.success("缓存清理成功");
      fetchCacheSize();
    } catch (e) {
      toast.error("清理缓存失败");
      console.error(e);
    }
  };

  const handleMaxCacheChange = async (value: number) => {
    setMaxCacheSize(value);
    try {
      await invoke("enforce_cache_limit", {
        maxBytes: value * 1024 * 1024 * 1024,
      });
      fetchCacheSize();
    } catch (e) {
      console.error("Failed to enforce cache limit", e);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <SettingsExpandar
        title="缓存管理"
        subtitle={`管理缓存`}
        icon={<DatabaseLightning20Regular />}
      >
        <div className="flex flex-col gap-0">
          <SettingsExpandarDetail>
            <span className="w-full text-sm text-foreground/60">
              当前缓存占用: {formatFileSize(currentCacheBytes)}
            </span>
          </SettingsExpandarDetail>
          <SettingsExpandarDetail>
            <div className="w-full flex items-center justify-between">
              <div className="w-78 flex gap-4 items-center">
                <span className="text-sm text-foreground/60">
                  缓存最大占用：{maxCacheSize}G
                </span>
                <Slider
                  value={[maxCacheSize]}
                  onValueChange={(value) => handleMaxCacheChange(value[0])}
                  max={50}
                  min={1}
                  step={1}
                  className="flex-1"
                />
              </div>

              <Button
                onClick={handleClearCache}
                className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0"
              >
                清除缓存
              </Button>
            </div>
          </SettingsExpandarDetail>
        </div>
      </SettingsExpandar>
    </div>
  );
}
