import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";

import { YeeButton } from "@/components/yee-button";
import { Slider } from "@/components/ui/slider";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { formatFileSize } from "@/lib/utils";
import { DatabaseLightning20Regular } from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function AudioCacheCard() {
	const maxCacheSize = useSettingStore((s) => s.audio.maxCacheSize);
	const setMaxCacheSize = useSettingStore((s) => s.setMaxCacheSize);
	const [currentCacheBytes, setCurrentCacheBytes] = useState(0);
	const [nativeCacheBytes, setNativeCacheBytes] = useState(0);
	const totalCacheBytes = currentCacheBytes + nativeCacheBytes;

	const fetchCacheSize = async () => {
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
	};

	useEffect(() => {
		fetchCacheSize();
	}, []);

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
		setMaxCacheSize(value);
		try {
			const maxBytes = value * 1024 * 1024 * 1024;
			await Promise.all([
				invoke("enforce_cache_limit", { maxBytes }),
				invoke("enforce_native_audio_cache_limit", { maxBytes }),
			]);
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
						<span className="w-full text-sm text-foreground/60">
							当前缓存占用：{formatFileSize(totalCacheBytes)}
						</span>
					</SettingsExpandarDetail>
					<SettingsExpandarDetail>
						<div className="flex w-full items-center justify-between">
							<div className="flex w-78 items-center gap-4">
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

							<YeeButton variant="default" onClick={handleClearCache}>
								清除缓存
							</YeeButton>
						</div>
					</SettingsExpandarDetail>
				</div>
			</SettingsExpandar>
		</div>
	);
}
