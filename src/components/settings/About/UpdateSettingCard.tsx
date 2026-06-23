import SettingsExpandar from "@/components/settings/SettingsExpandar";

import {
	CheckmarkCircle24Filled,
	CheckmarkStarburst20Regular,
	Info20Regular,
} from "@fluentui/react-icons";
import { Update, check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { YeeButton } from "@/components/yee-button";

export function UpdateSettingCard() {
	const [version, setVersion] = useState("");
	const [checking, setChecking] = useState(false);
	const [isNewest, setIsNewest] = useState<boolean | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateObj, setUpdateObj] = useState<Update | null>(null);
	const [progress, setProgress] = useState<{
		downloaded: number;
		contentLength: number;
	} | null>(null);

	async function checkForUpdates() {
		const update = await check();
		if (update) {
			console.log(`found update ${update.version}`);
			setUpdateObj(update);
			setIsNewest(false);
			toast.success(`发现新版本 v${update.version}！`, { duration: 3000 });
		} else {
			setUpdateObj(null);
			setIsNewest(true);
		}
	}

	async function handleUpdate() {
		if (!updateObj) return;

		setIsUpdating(true);

		let downloaded = 0;
		let contentLength = 0;

		try {
			await updateObj.downloadAndInstall((event) => {
				switch (event.event) {
					case "Started":
						contentLength = event.data.contentLength || 0;
						console.log(`started downloading ${contentLength} bytes`);
						setProgress({ downloaded, contentLength });
						break;
					case "Progress":
						downloaded += event.data.chunkLength || 0;
						console.log(`downloaded ${downloaded} from ${contentLength}`);
						setProgress({ downloaded, contentLength });
						break;
					case "Finished":
						console.log("download finished");
						break;
				}
			});

			console.log("update installed");
			toast.success("更新下载完成，即将重启并挂载更新...", { duration: 3000 });
			setTimeout(async () => {
				await relaunch();
			}, 3000);
		} catch (e) {
			console.log(`failed to install update: ${e}`);
			toast.error("更新失败，请稍后重试...");
		} finally {
			setIsUpdating(false);
			setProgress(null);
		}
	}

	async function handleCheck() {
		setChecking(true);
		setIsNewest(null);
		try {
			await checkForUpdates();
		} catch (e) {
			console.log(`failed to check update: ${e}`);
			toast.error("检查更新失败，请重试...");
		} finally {
			setChecking(false);
		}
	}

	useEffect(() => {
		async function loadVersion() {
			const v = await getVersion();
			setVersion(v);
		}

		loadVersion();
	}, []);

	return (
		<div className="flex flex-col gap-0">
			<SettingsExpandar
				className={cn(isNewest !== null && "rounded-b-none")}
				title={`Beta ${version}`}
				icon={<CheckmarkStarburst20Regular />}
				trailing={
					<div className="flex justify-end">
						<YeeButton
							variant="default"
							className={cn(checking && "bg-muted")}
							onClick={handleCheck}
							disabled={checking || isUpdating}
						>
							<div className="flex gap-2 transition-[width] duration-300 ease-in-out">
								<Spinner
									className={cn(
										"transition-all duration-300 -mx-2.5",
										checking
											? "opacity-100 scale-100 mx-0"
											: "opacity-0 scale-75",
									)}
								/>
								<span>{checking ? "检查中..." : "检查更新"}</span>
							</div>
						</YeeButton>
					</div>
				}
			></SettingsExpandar>
			{isNewest === true && (
				<div className="bg-green-400/25 rounded-b-md border-t-0 border border-border p-4 flex items-center gap-2 text-sm">
					<CheckmarkCircle24Filled className="text-green-600" />
					已更新到最新版本
				</div>
			)}
			{isNewest === false && updateObj && (
				<div className="bg-card/60 rounded-b-md border-t-0 border border-border p-4 flex flex-col gap-4 text-sm">
					<div className="flex justify-between items-center gap-2">
						<div className="flex items-center gap-4">
							<Info20Regular className="text-foreground" />
							检测到新版本 v{updateObj.version}，是否立即更新？
						</div>

						<div className="flex items-center gap-4">
							<YeeButton
								variant="default"
								onClick={handleUpdate}
								disabled={isUpdating}
							>
								{isUpdating ? (
									<div className="flex items-center gap-2">
										<Spinner />
										<span>
											{progress && progress.contentLength > 0
												? `正在下载 (${((progress.downloaded / progress.contentLength) * 100).toFixed(0)}%)`
												: "正在更新..."}
										</span>
									</div>
								) : (
									"立即更新"
								)}
							</YeeButton>
						</div>
					</div>
					{isUpdating && progress && progress.contentLength > 0 && (
						<div className="w-full h-1 bg-muted rounded-full overflow-hidden">
							<div
								className="h-full bg-primary transition-all duration-300 ease-out"
								style={{
									width: `${(progress.downloaded / progress.contentLength) * 100}%`,
								}}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
