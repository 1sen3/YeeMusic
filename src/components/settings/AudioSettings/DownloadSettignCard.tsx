import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { YeeButton } from "@/components/yee-button";

import { ArrowDownload20Regular } from "@fluentui/react-icons";
import { toast } from "sonner";
import { useEffect } from "react";
import { useDownloadStore } from "@/lib/store/downloadStore/downloadStore";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export function DownloadSettingCard() {
	const downloadDir = useDownloadStore((s) => s.downloadDir);
	const setDownloadDir = useDownloadStore((s) => s.setDownloadDir);
	const loadFromStore = useDownloadStore((s) => s.loadFromStore);

	useEffect(() => {
		loadFromStore();
	}, []);

	async function handleChangeDir() {
		try {
			const selected = await open({
				directory: true,
				title: "选择下载目录",
			});
			if (!selected) return;
			await invoke("ensure_dir_exists", { path: selected });
			await setDownloadDir(selected as string);
		} catch (e) {
			console.error("更改下载目录失败:", e);
			toast.error(`更改目录失败：${e}`);
		}
	}

	return (
		<SettingsExpandar
			title="下载"
			subtitle="选择歌曲下载的目录"
			icon={<ArrowDownload20Regular />}
		>
			<div className="flex flex-col gap-0">
				<SettingsExpandarDetail>
					<div className="w-full flex justify-between items-center">
						<span className="text-sm text-muted-foreground truncate max-w-xs">
							{downloadDir || "加载中..."}
						</span>
						<YeeButton variant="default" onClick={handleChangeDir}>
							更改目录
						</YeeButton>
					</div>
				</SettingsExpandarDetail>
			</div>
		</SettingsExpandar>
	);
}
