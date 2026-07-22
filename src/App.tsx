import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import { initMediaSession } from "./lib/store/playerStore/mediaSessionSync";
import ErrorPage from "./pages/ErrorPage";
import HomePage from "./pages/HomePage";

// 除首页外全部路由懒加载：导航时 react-router 会等 chunk 就绪再切换，
// chunk 走本地 asset 协议毫秒级加载，无需 loading 态
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
	Component: (await load()).default,
});

const router = createBrowserRouter([
	{
		path: "/",
		element: <RootLayout />,
		// 布局本身崩溃时的兜底
		errorElement: <ErrorPage />,
		children: [
			{
				// 无路径包装路由：子页面报错时只替换内容区，保留侧边栏和播放条
				errorElement: <ErrorPage />,
				children: [
					{
						index: true,
						element: <HomePage />,
					},
					{
						path: "search",
						lazy: page(() => import("./pages/SearchPage")),
					},
					{
						path: "detail/album",
						lazy: page(() => import("./pages/detail/AlbumDetailPage")),
					},
					{
						path: "detail/artist",
						lazy: page(() => import("./pages/detail/ArtistDetailPage")),
					},
					{
						path: "detail/playlist",
						lazy: page(() => import("./pages/detail/PlaylistDetailPage")),
					},
					{
						path: "library/recent",
						lazy: page(() => import("./pages/library/RecentPage")),
					},
					{
						path: "library/cloud",
						lazy: page(() => import("./pages/library/CloudPage")),
					},
					{
						path: "library/download",
						lazy: page(() => import("./pages/library/DownloadPage")),
					},
					{
						path: "library/local",
						lazy: page(() => import("./pages/library/LocalPage")),
					},
					{
						path: "setting",
						lazy: page(() => import("./pages/SettingPage")),
					},
					{
						path: "profile",
						lazy: page(() => import("./pages/ProfilePage")),
					},
					{
						path: "recommend/daily",
						lazy: async () => ({
							Component: (await import("./pages/recommend/DailyRecommendPage"))
								.DailyRecommendPage,
						}),
					},
				],
			},
		],
	},
	{
		path: "/tray-menu",
		lazy: page(() => import("./pages/TrayMenu")),
	},
]);

export default function App() {
	const [isBackground, setIsBackground] = useState(false);

	let mediaSessionInitialized = false;

	useEffect(() => {
		if (!mediaSessionInitialized && getCurrentWindow().label === "main") {
			const cleanup = initMediaSession();
			mediaSessionInitialized = true;

			return () => cleanup();
		}
	}, []);

	useEffect(() => {
		const unlistenBg = listen("app-background", () => {
			setIsBackground(true);
		});

		const unlistenFg = listen("app-foreground", () => {
			setIsBackground(false);
		});

		return () => {
			unlistenBg.then((f) => f());
			unlistenFg.then((f) => f());
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
				e.preventDefault();
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, []);

	if (isBackground && getCurrentWindow().label === "main") {
		return <div style={{ display: "none" }}></div>;
	}

	return <RouterProvider router={router} />;
}
