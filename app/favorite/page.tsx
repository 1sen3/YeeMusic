"use client";

import { PlaylistPage } from "@/components/playlist/detail/playlist-page";
import { useUserStore } from "@/lib/store/userStore";

export default function Page() {
  const favPlaylist = useUserStore((s) => s.favPlaylist);

  if (!favPlaylist) return null;

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <PlaylistPage playlist={favPlaylist} isMyPlaylist={true} />
    </div>
  );
}
