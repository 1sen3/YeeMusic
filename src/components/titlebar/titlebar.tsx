import { useTitlebar } from "@/contexts/titlebar-context";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { useAppWindow } from "@/hooks/use-app-window";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { cn } from "@/lib/utils";
import {
	ArrowClockwise24Regular,
	ArrowLeft20Regular,
	Dismiss24Regular,
	Maximize24Regular,
	Person20Regular,
	Person24Filled,
	SignOut20Regular,
	SquareMultiple24Regular,
	Subtract24Regular,
} from "@fluentui/react-icons";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../modal/login-form";
import { LogoutForm } from "../modal/logout-form";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { YeeButton } from "../yee-button";
import { SearchInput } from "./search-input";

export function Titlebar() {
	const navigate = useNavigate();
	const { canGoBack } = useNavigationHistory();
	const { onRefresh, isRefreshing } = useTitlebar();
	const { minimize, toogleMaximize, close, isMaximized, startDragging } =
		useAppWindow();

	const handleRefresh = () => {
		if (onRefresh && !isRefreshing) {
			onRefresh();
		}
	};

	const MaxmizeIcon = isMaximized ? SquareMultiple24Regular : Maximize24Regular;
	const [isLoginOpen, setIsLoginOpen] = useState(false);
	const [isLogoutOpen, setIsLogoutOpen] = useState(false);
	const user = useUserStore((state) => state.user);

	const lastClickTimeRef = useRef(0);

	return (
		<>
			<div
				className="top-0 z-50 flex h-12 w-full items-center pl-1"
				onMouseDown={(e) => {
					if (e.button !== 0) return;
					if (!e.currentTarget.contains(e.target as Node)) return;
					const currentTime = new Date().getTime();
					const timeDiff = currentTime - lastClickTimeRef.current;
					if (timeDiff < 300) {
						toogleMaximize();
						lastClickTimeRef.current = 0;
					} else {
						lastClickTimeRef.current = currentTime;
						startDragging();
					}
				}}
				onContextMenu={(e) => {
					e.preventDefault();
				}}
			>
				<motion.div
					layout
					className="flex min-w-0 flex-1 shrink-0 items-center gap-2 pl-2"
				>
					<AnimatePresence mode="popLayout">
						{canGoBack && (
							<motion.div
								key="back-button"
								initial={{ opacity: 0, x: -12, scale: 0.8 }}
								animate={{ opacity: 1, x: 0, scale: 1 }}
								exit={{ opacity: 0, x: -12, scale: 0.8 }}
								transition={{ type: "spring", stiffness: 350, damping: 25 }}
								className="shrink-0"
							>
								<YeeButton
									variant="ghost"
									className="-ml-0.5 size-8 shrink-0 rounded-sm hover:bg-foreground/5"
									icon={<ArrowLeft20Regular className="size-4" />}
									onMouseDown={(e) => e.stopPropagation()}
									onClick={() => navigate(-1)}
								/>
							</motion.div>
						)}
					</AnimatePresence>

					<motion.div
						layout
						transition={{ type: "spring", stiffness: 350, damping: 25 }}
						className="flex items-center gap-2"
					>
						<div className="flex shrink-0 items-center gap-2 truncate group-data-[collapsible=icon]:hidden">
							<div className="flex aspect-square size-8 items-center justify-center rounded-lg">
								<img
									src="/icons/logo.png"
									alt="Yee Music Logo"
									width={20}
									height={20}
									className="rounded-sm"
								/>
							</div>
							<span className="truncate font-[微软雅黑] font-normal text-[13px] text-foreground">
								Yee Music
							</span>
						</div>
					</motion.div>
				</motion.div>

				<div className="flex min-w-50 flex-1 shrink-0 justify-center">
					<div onMouseDown={(e) => e.stopPropagation()}>
						<SearchInput />
					</div>
				</div>

				<div className="flex flex-1 shrink-0 items-center justify-end">
					{onRefresh && (
						<YeeButton
							variant="ghost"
							className="mr-4 size-8 shrink-0 rounded-sm hover:bg-foreground/5"
							icon={
								<ArrowClockwise24Regular
									className={cn(isRefreshing && "animate-spin")}
								/>
							}
							onClick={handleRefresh}
							disabled={isRefreshing}
							onMouseDown={(e) => e.stopPropagation()}
						/>
					)}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="mr-4" onMouseDown={(e) => e.stopPropagation()}>
								<Avatar className="size-7 border border-border transition-transform duration-300 hover:scale-90">
									<AvatarImage src={user?.avatarUrl} alt="1sen" />
									<AvatarFallback>
										<Person24Filled className="size-4" />
									</AvatarFallback>
								</Avatar>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							sideOffset={8}
							align="end"
							side="bottom"
							className="h-auto w-auto rounded-md border border-border bg-card/80 p-2 backdrop-blur-md"
						>
							{!user && (
								<DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
									<LogIn />
									登录
								</DropdownMenuItem>
							)}

							{!!user && (
								<>
									<DropdownMenuItem>
										<div className="flex items-center gap-4 pr-16">
											<Avatar className="size-10 border border-border">
												<AvatarImage src={user?.avatarUrl} alt="1sen" />
												<AvatarFallback>
													<Person20Regular />
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="font-semibold">{user.nickname}</span>
												<span className="flex items-center text-foreground/60 text-xs">
													个人信息
												</span>
											</div>
										</div>
									</DropdownMenuItem>

									<DropdownMenuSeparator />

									<DropdownMenuItem
										variant="destructive"
										onClick={() => setIsLogoutOpen(true)}
									>
										<SignOut20Regular />
										退出登录
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					<Button
						className="size-12 rounded-none border-0 hover:bg-black/5"
						variant="ghost"
						size="icon"
						onClick={minimize}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<Subtract24Regular className="size-4" />
					</Button>
					<Button
						className="size-12 rounded-none border-0 hover:bg-black/5"
						variant="ghost"
						size="icon"
						onClick={toogleMaximize}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<MaxmizeIcon className="size-4" />
					</Button>
					<Button
						className="size-12 rounded-none rounded-tr-lg border-0 hover:bg-destructive hover:text-white"
						variant="ghost"
						size="icon"
						onClick={close}
						onMouseDown={(e) => e.stopPropagation()}
					>
						<Dismiss24Regular className="size-4" />
					</Button>
				</div>
			</div>
			<LoginForm open={isLoginOpen} onOpenChange={setIsLoginOpen} />
			<LogoutForm open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
		</>
	);
}
