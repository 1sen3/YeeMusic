import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PlayerBar } from "@/components/playerbar/playerbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthConfig } from "@/components/providers/auth-provider";
import { Titlebar } from "@/components/titlebar/titlebar";
import { TitlebarProvider } from "@/contexts/titlebar-context";
import { cn } from "@/lib/utils";
import { GlobalContextMenu } from "@/components/context-menu/global-context-menu";
import { useContextMenuStore } from "@/lib/store/contextMenuStore/contextMenuStore";
import { LocalMusicMatchDialog } from "@/components/local-music/local-music-match-dialog";
import { ScrollIndicator } from "@/components/scroll-indicator";
import { GlassHighlightController } from "@/components/glass-highlight-controller";
import { PageTransition } from "@/components/page-transition";

export default function RootLayout() {
	return (
		<div
			className={cn(
				"font-sans antialiased h-screen flex flex-col overflow-hidden select-none bg-background",
			)}
		>
			<GlassHighlightController />
			<AuthConfig />
			<TitlebarProvider>
				<SidebarProvider className="flex w-full h-full flex-col overflow-hidden min-h-0!">
					<div className="w-full shrink-0 z-50">
						<Suspense>
							<Titlebar />
						</Suspense>
					</div>

					<div className="flex-1 w-full overflow-hidden flex relative">
						<Suspense fallback={null}>
							<AppSidebar />
						</Suspense>

						<div
							id="main-wrapper"
							className="relative flex flex-col flex-1 overflow-hidden bg-main-background border border-border rounded-tl-lg border-b-0 "
						>
							<main
								id="main-scroll-container"
								className="flex-1 w-full h-full overflow-y-auto no-scrollbar"
								onDragStart={(e) => e.preventDefault()}
								onContextMenu={(e) => {
									e.preventDefault();
									if (useContextMenuStore.getState().isOpen) return;
									const selection = window.getSelection();
									const text = selection?.toString().trim();
									if (text) {
										useContextMenuStore
											.getState()
											.openMenu(e.clientX, e.clientY, "text-selection", {
												selectedText: text,
											});
									}
								}}
							>
								<PageTransition>
									<Outlet />
								</PageTransition>

								<Toaster
									containerAriaLabel="Notifications"
									className="absolute"
									style={{ position: "absolute" }}
								/>
							</main>
							<ScrollIndicator />
						</div>
					</div>
				</SidebarProvider>
			</TitlebarProvider>
			<GlobalContextMenu />
			<LocalMusicMatchDialog />
			<div className="w-full z-40">
				<PlayerBar />
			</div>
		</div>
	);
}
