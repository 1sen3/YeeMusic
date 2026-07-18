import { CalendarLtr24Regular, Edit24Filled } from "@fluentui/react-icons";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { YeeButton } from "@/components/yee-button";
import { updateUserProfile } from "@/lib/services/user";
import { useUserStore } from "@/lib/store/userStore/userStore";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const MAX_NICKNAME_LENGTH = 30;
const MAX_SIGNATURE_LENGTH = 300;

function timestampToDate(timestamp?: number) {
	if (!timestamp || timestamp <= 0) return undefined;
	const date = new Date(timestamp);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatBirthday(date?: Date) {
	if (!date) return "";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function ProfileEditButton({
	profile,
	onSuccess,
}: {
	profile: UserProfile;
	onSuccess?: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [nickname, setNickname] = useState(profile.nickname);
	const [signature, setSignature] = useState(profile.signature || "");
	const [gender, setGender] = useState(String(profile.gender ?? 0));
	const [birthday, setBirthday] = useState<Date | undefined>(
		timestampToDate(profile.birthday),
	);

	const user = useUserStore((s) => s.user);
	const setUser = useUserStore((s) => s.setUser);

	const resetForm = () => {
		setNickname(profile.nickname);
		setSignature(profile.signature || "");
		setGender(String(profile.gender ?? 0));
		setBirthday(timestampToDate(profile.birthday));
	};

	const canSubmit =
		!!nickname.trim() &&
		(nickname.trim() !== profile.nickname ||
			signature !== (profile.signature || "") ||
			gender !== String(profile.gender ?? 0) ||
			formatBirthday(birthday) !==
				formatBirthday(timestampToDate(profile.birthday)));

	async function handleSave() {
		if (!canSubmit || saving) return;

		try {
			setSaving(true);
			const nextNickname = nickname.trim();
			const nextGender = Number(gender);
			const res = await updateUserProfile({
				nickname: nextNickname,
				signature,
				gender: nextGender,
				birthday: birthday?.getTime() || profile.birthday || 0,
				province: profile.province ?? 0,
				city: profile.city ?? 0,
			});

			if (!res) {
				toast.error("个人信息更新失败", { position: "top-center" });
				return;
			}

			toast.success("个人信息更新成功", { position: "top-center" });

			if (user) {
				const updated = {
					...user,
					nickname: nextNickname,
					signature,
					gender: nextGender,
				};
				setUser(updated);
				localStorage.setItem("userInfo", JSON.stringify(updated));
			}

			setOpen(false);
			onSuccess?.();
		} catch (err) {
			console.error("更新个人信息失败：", err);
			toast.error("个人信息更新失败", { position: "top-center" });
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				setOpen(val);
				if (val) resetForm();
			}}
		>
			<DialogTrigger asChild>
				<YeeButton
					variant="default"
					size="lg"
					icon={<Edit24Filled className="size-4" />}
					content="编辑资料"
				/>
			</DialogTrigger>
			<DialogContent className="sm:max-w-xl">
				<DialogTitle className="sr-only">编辑个人信息</DialogTitle>
				<DialogBody>
					<div className="flex flex-col gap-6 p-4 pt-6">
						<div className="flex flex-col gap-2">
							<span className="text-sm text-foreground/60">昵称</span>
							<div className="relative">
								<Input
									className="rounded-md bg-card pr-16 text-foreground/80"
									containerClassName="rounded-md"
									value={nickname}
									onChange={(e) => {
										if (e.target.value.length > MAX_NICKNAME_LENGTH) return;
										setNickname(e.target.value);
									}}
								/>
								<span className="-translate-y-1/2 absolute top-1/2 right-4 text-foreground/40 text-sm">
									{nickname.length}/{MAX_NICKNAME_LENGTH}
								</span>
							</div>
						</div>

						<div className="flex gap-6">
							<div className="flex flex-1 flex-col gap-2">
								<span className="text-sm text-foreground/60">性别</span>
								<Select value={gender} onValueChange={setGender}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="0">保密</SelectItem>
										<SelectItem value="1">男</SelectItem>
										<SelectItem value="2">女</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-1 flex-col gap-2">
								<span className="text-sm text-foreground/60">生日</span>
								<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
									<PopoverTrigger asChild>
										<Button
											type="button"
											variant="winui"
											className={cn(
												"w-full px-3",
												!birthday && "text-foreground/40",
											)}
										>
											<div className="flex w-full items-center justify-between">
												<span>{formatBirthday(birthday) || "选择日期"}</span>
												<CalendarLtr24Regular className="size-4 shrink-0 text-foreground/50" />
											</div>
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={birthday}
											defaultMonth={birthday}
											startMonth={new Date(1900, 0)}
											endMonth={new Date()}
											disabled={{ after: new Date() }}
											onSelect={(date) => {
												setBirthday(date);
												setDatePickerOpen(false);
											}}
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						<div className="flex flex-col gap-2">
							<span className="text-sm text-foreground/60">个性签名</span>
							<div className="relative">
								<Textarea
									className="h-28 resize-none rounded-md bg-card p-4 text-foreground/80"
									placeholder="介绍一下自己..."
									value={signature}
									onChange={(e) => {
										if (e.target.value.length > MAX_SIGNATURE_LENGTH) return;
										setSignature(e.target.value);
									}}
								/>
								<span className="absolute right-4 bottom-3 text-foreground/40 text-sm">
									{MAX_SIGNATURE_LENGTH - signature.length}
								</span>
							</div>
						</div>
					</div>
				</DialogBody>
				<DialogFooter>
					<DialogCancel>取消</DialogCancel>
					<DialogAction disabled={!canSubmit || saving} onClick={handleSave}>
						<span className="flex items-center gap-2">
							{saving && <Spinner />}保存
						</span>
					</DialogAction>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
