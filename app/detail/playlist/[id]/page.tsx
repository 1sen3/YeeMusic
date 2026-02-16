"use client";

import { PlaylistPage } from "@/components/playlist/detail/playlist-page";
import { DetailPageSkeleton } from "@/components/detail-page-skeleton";
import { getPlaylistDetail } from "@/lib/services/playlist";
import { Playlist } from "@/lib/types";
import { use, useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/userStore";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const user = useUserStore((s) => s.user);

  useEffect(() => {
    async function fetchPlaylist() {
      setIsLoading(true);
      try {
        const res = await getPlaylistDetail(id);
        setPlaylist(res.playlist);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlaylist();
  }, [id]);

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <DetailPageSkeleton loading={isLoading} data={playlist}>
        {(playlist) => (
          <PlaylistPage
            playlist={playlist}
            isMyPlaylist={playlist.creator.userId === user?.userId}
          />
        )}
      </DetailPageSkeleton>
    </div>
  );
}

// export const runtime = "edge";
