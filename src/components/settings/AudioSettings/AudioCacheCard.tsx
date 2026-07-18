import { DatabaseLightning20Regular } from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { NumberStepper } from "@/components/ui/number-stepper";
import { YeeButton } from "@/components/yee-button";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { formatFileSize } from "@/lib/utils";

export function AudioCacheCard() {
	const maxCacheSize = useSettingStore((s) => s.audio.maxCacheSize);
	const setMaxCacheSize = useSettingStore((s) => s.setMaxCacheSize);
	const [currentCacheBytes, setCurrentCacheBytes] = useState(0);
	const [nativeCacheBytes, setNativeCacheBytes] = useState(0);
	const totalCacheBytes = currentCacheBytes + nativeCacheBytes;

	const fetchCacheSize = useCallback(async () => {
		try {
			const [sizeBytes, nativeSizeBytes] = await Promise.all([
				invoke<number>("get_audio_cache_size"),
				invoke<number>("get_native_audio_cache_size"),
			]);
			setCurrentCacheBytes(sizeBytes);
			setNativeCacheBytes(nativeSizeBytes);
		} catch (e) {
			console.error("Failed to get cache size", e);
		}
	}, []);

	useEffect(() => {
		fetchCacheSize();
	}, [fetchCacheSize]);

	const handleClearCache = async () => {
		try {
			await Promise.all([
				invoke("clear_audio_cache"),
				invoke("clear_native_audio_cache"),
			]);
			toast.success("缓存清理成功");
			fetchCacheSize();
		} catch (e) {
			toast.error("清理缓存失败");
			console.error(e);
		}
	};

	const handleMaxCacheChange = async (value: number) => {
		try {
			await setMaxCacheSize(value);
			fetchCacheSize();
		} catch (e) {
			console.error("Failed to enforce cache limit", e);
		}
	};

	return (
		<div className="flex flex-col gap-1">
			<SettingsExpandar
				title="缓存管理"
				subtitle="管理缓存"
				icon={<DatabaseLightning20Regular />}
			>
				<div className="flex flex-col gap-0">
          <SettingsExpandarDetail>
            <div className="flex w-full items-center justify-between">
						<span className="w-full text-sm text-foreground/60">
							当前缓存占用：{formatFileSize(totalCacheBytes)}
            </span>

            <YeeButton variant="default" onClick={handleClearCache}>
								清除缓存
              </YeeButton>
            </div>
					</SettingsExpandarDetail>
					<SettingsExpandarDetail>
						<div className="flex w-full items-center justify-between">
								<span className="mr-2 text-sm text-foreground/60">
									缓存最大占用
								</span>


							<div className="flex items-center gap-2">

								<NumberStepper
									label="缓存最大占用"
									value={maxCacheSize}
									onValueChange={(value) => void handleMaxCacheChange(value)}
									max={50}
									min={1}
									step={0.5}
								/>
                <span className="text-sm text-muted-foreground">GB</span>
							</div>
						</div>
					</SettingsExpandarDetail>
				</div>
			</SettingsExpandar>
		</div>
	);
}
