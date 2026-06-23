import { Checkmark24Filled } from "@fluentui/react-icons";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
	checkQrStatus,
	createQrImg,
	getQrKey,
	loginByPhone,
	loginStatus,
	sentCaptcha,
	verifyCaptcha,
} from "@/lib/services/auth";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { cn } from "@/lib/utils";
import {
	Dialog,
	DialogAction,
	DialogBody,
	DialogCancel,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Skeleton } from "../ui/skeleton";
import { Spinner } from "../ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function LoginForm({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const [count, setCount] = useState(0);
	const [isLoad, setIsLoad] = useState(false);
	const [isLogin, setIsLogin] = useState(false);
	const [phone, setPhone] = useState("");
	const [captcha, setCaptcha] = useState("");
	const [captchaPassed, setCaptchaPassed] = useState(false);
	const [error, setError] = useState("");

	const [qrCodeImg, setQrCodeImg] = useState("");
	const [qrStatus, setQrStatus] = useState(0);

	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

	const setUser = useUserStore((state) => state.setUser);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, []);

	useEffect(() => {
		return () => {
			if (qrTimerRef.current) clearInterval(qrTimerRef.current);
		};
	}, []);

	async function handleGetCaptcha() {
		if (!phone || phone.length !== 11) return;
		if (count > 0) return;

		try {
			setIsLoad(true);
			await sentCaptcha(phone);
			setCount(60);
			timerRef.current = setInterval(() => {
				setCount((prev) => {
					if (prev <= 1) {
						if (timerRef.current) clearInterval(timerRef.current);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoad(false);
		}
	}

	async function handleVerifyCaptcha() {
		if (!phone || !captcha || captcha.length !== 4) return;

		try {
			setIsLoad(true);
			const res = await verifyCaptcha(phone, captcha);
			if (res?.code === 200) {
				setCaptchaPassed(true);
			}
		} catch (err) {
			console.error(err);
			setCaptchaPassed(false);
		} finally {
			setIsLoad(false);
		}
	}

	async function handleLogin() {
		try {
			setIsLogin(true);
			const res = await loginByPhone(phone, captcha);
			if (res.code === 200) {
				toast.success("登录成功", { position: "top-right" });
				setUser(res.profile);
				onOpenChange?.(false);
			}
		} catch (err) {
			console.error(err);

			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError("登录失败，请重试");
			}
		} finally {
			setIsLogin(false);
		}
	}

	async function setupQrCode() {
		try {
			const keyRes = await getQrKey();
			const key = keyRes.data.unikey;

			const imgRes = await createQrImg(key);
			setQrCodeImg(imgRes.data.qrimg);
			setQrStatus(801);

			startCheckQrStatus(key);
		} catch (err) {
			console.error("二维码初始化失败", err);
		}
	}

	async function startCheckQrStatus(key: string) {
		if (qrTimerRef.current) clearInterval(qrTimerRef.current);

		qrTimerRef.current = setInterval(async () => {
			try {
				const res = await checkQrStatus(key);
				setQrStatus(res.code);

				if (res.code === 800) {
					clearInterval(qrTimerRef.current!);
				} else if (res.code === 803) {
					clearInterval(qrTimerRef.current!);
					toast.success("登录成功", { position: "top-center" });

					const statusRes = await loginStatus();
					if (statusRes.code === 200 && statusRes.profile) {
						setUser(statusRes.profile);
					}

					onOpenChange?.(false);
				}
			} catch (err) {
				console.log("轮询错误", err);
			}
		}, 3000);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogTitle className="sr-only">登录</DialogTitle>
				<DialogBody>
					<div className="w-full min-w-0 p-4">
						<Tabs
							className="w-full"
							onValueChange={(v) => {
								if (v === "qrcode") {
									setupQrCode();
								} else if (qrTimerRef.current) {
									clearInterval(qrTimerRef.current);
								}
							}}
						>
							<TabsList className="mx-auto rounded-full">
								<TabsTrigger value="cellphone">验证码登录</TabsTrigger>
								<TabsTrigger value="qrcode">扫码登录</TabsTrigger>
							</TabsList>
							<TabsContent value="cellphone">
								<div className="flex w-full flex-col gap-10 pt-6">
									<div className="relative flex w-full flex-col gap-4">
										<Label htmlFor="phone">手机号</Label>
										<Input
											id="phone"
											name="name"
											placeholder="请输入手机号"
											value={phone}
											onChange={(e) => {
												setPhone(e.target.value);
												setCaptchaPassed(false);
												if (error) setError("");
											}}
											onBlur={() => {
												if (!phone) return;
												if (!/^1\d{10}$/.test(phone)) {
													setError("手机号格式不正确");
												}
											}}
											className={cn(
												"w-full bg-card",
												error && "border-2 border-destructive",
											)}
											containerClassName="rounded-sm"
											autoComplete="off"
										/>
										<span className="-bottom-6.5 absolute -mt-1 text-destructive text-xs">
											{error}
										</span>
									</div>
									<div className="flex w-full flex-col gap-4">
										<Label htmlFor="captcha">验证码</Label>

										<div className="flex w-full gap-2">
											<Input
												id="captcha"
												name="captcha"
												placeholder="请输入验证码"
												value={captcha}
												onChange={(e) => {
													setCaptcha(e.target.value);
													setCaptchaPassed(false);
												}}
												onBlur={handleVerifyCaptcha}
												className="bg-card"
												containerClassName="flex-1 rounded-sm"
											/>
											<motion.button
												className={cn(
													captchaPassed
														? "bg-green-600!"
														: "bg-card! hover:bg-foreground/5!",
													"flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap rounded-md border border-border px-4 text-foreground",
												)}
												disabled={isLoad || captchaPassed}
												onClick={handleGetCaptcha}
												layout
												transition={{
													type: "spring",
													stiffness: 300,
													damping: 25,
												}}
											>
												<motion.div
													layout="position"
													className="flex items-center justify-center gap-1"
												>
													{isLoad ? <Spinner /> : ""}
													{captchaPassed ? (
														<Checkmark24Filled className="size-4 text-white" />
													) : count > 0 ? (
														`${count} 秒后重试`
													) : (
														"获取验证码"
													)}
												</motion.div>
											</motion.button>
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="qrcode">
								<div className="flex flex-col items-center gap-6 pt-6">
									{qrCodeImg ? (
										<img
											src={qrCodeImg}
											width={144}
											height={144}
											className={cn(
												"rounded-md drop-shadow-md",
												qrStatus === 800 ? "opacity-20" : "",
											)}
											alt="Login qr code"
										/>
									) : (
										<Skeleton className="h-36 w-36" />
									)}

									<p>
										使用<span className="font-bold">网易云音乐 APP</span>{" "}
										扫码登录
									</p>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				</DialogBody>
				<DialogFooter className="gap-2">
					<DialogCancel>取消</DialogCancel>
					<DialogAction
						type="submit"
						disabled={!captchaPassed || error !== ""}
						onClick={handleLogin}
					>
						{isLogin ? <Spinner /> : ""}登录
					</DialogAction>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
