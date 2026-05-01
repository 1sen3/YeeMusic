import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import AlbumDetailPage from "./pages/detail/AlbumDetailPage";
import ArtistDetailPage from "./pages/detail/ArtistDetailPage";
import PlaylistDetailPage from "./pages/detail/PlaylistDetailPage";
import RecentPage from "./pages/library/RecentPage";
import CloudPage from "./pages/library/CloudPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { initMediaSession } from "./lib/store/mediaSessionSync";
import DownloadPage from "./pages/library/DownloadPage";
import LocalPage from "./pages/library/LocalPage";
import { DailyRecommendPage } from "./pages/recommend/DailyRecommendPage";
import TrayMenu from "./pages/TrayMenu";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "detail/album",
        element: <AlbumDetailPage />,
      },
      {
        path: "detail/artist",
        element: <ArtistDetailPage />,
      },
      {
        path: "detail/playlist",
        element: <PlaylistDetailPage />,
      },
      {
        path: "library/recent",
        element: <RecentPage />,
      },
      {
        path: "library/cloud",
        element: <CloudPage />,
      },
      {
        path: "library/download",
        element: <DownloadPage />,
      },
      {
        path: "library/local",
        element: <LocalPage />,
      },
      {
        path: "setting",
        element: <SettingPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "recommend/daily",
        element: <DailyRecommendPage />,
      },
    ],
  },
  {
    path: "/tray-menu",
    element: <TrayMenu />,
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

  if (isBackground && getCurrentWindow().label === "main") {
    return <div style={{ display: "none" }}></div>;
  }

  return <RouterProvider router={router} />;
}
