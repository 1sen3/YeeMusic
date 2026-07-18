import { Globe20Regular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Input } from "@/components/ui/input";
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl } from "@/lib/api";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";

function isValidHttpUrl(value: string) {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function ApiSettingCard() {
	const apiBaseUrl = useSettingStore((s) => s.network.apiBaseUrl);
	const setApiBaseUrl = useSettingStore((s) => s.setApiBaseUrl);

	const [draft, setDraft] = useState(apiBaseUrl);

	useEffect(() => {
		setDraft(apiBaseUrl);
	}, [apiBaseUrl]);

	const commitDraft = async () => {
		const next = normalizeApiBaseUrl(draft);
		if (next && !isValidHttpUrl(next)) {
			toast.error("API 地址需要是 http(s):// 开头的完整地址");
			setDraft(apiBaseUrl);
			return;
		}

		setDraft(next);
		if (next === apiBaseUrl) return;

		try {
			await setApiBaseUrl(next);
		} catch (error) {
			console.error("Failed to save API base url", error);
			toast.error("无法保存 API 地址");
		}
	};

	return (
		<SettingsExpandar
			icon={<Globe20Regular />}
			title="API 服务"
			subtitle="自定义音乐数据 API 服务地址"
		>
			<SettingsExpandarDetail desc="服务地址">
				<Input
					className="w-80 bg-card"
					value={draft}
					placeholder={DEFAULT_API_BASE_URL}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={commitDraft}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
					}}
				/>
			</SettingsExpandarDetail>
		</SettingsExpandar>
	);
}
