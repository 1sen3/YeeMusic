import { useSearchParams } from "react-router-dom";
import { PlaylistPage } from "@/components/playlist/detail/playlist-page";
import {
  getPlaylistAllTrack,
  getPlaylistDetail,
} from "@/lib/services/playlist";
import { Playlist, Song } from "@/lib/types";
import { useEffect, useState, Suspense } from "react";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { useSongLogic } from "@/hooks/use-song-logic";
import { PlaylistSkeleton } from "@/components/skeleton/playlist-skeleton";

function PlaylistContent() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const user = useUserStore((s) => s.user);
  const { handleGetSongDetail } = useSongLogic();

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      setPlaylist(null);
      setSongs([]);
      setIsLoading(true);

      try {
        const [res, tracksRes] = await Promise.all([
          getPlaylistDetail(id),
          getPlaylistAllTrack(id),
        ]);
        setPlaylist(res.playlist);
        setSongs(tracksRes);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    const handleSongRemoved = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { playlistId: removedPid, songId } = customEvent.detail;

      if (removedPid.toString() === id?.toString()) {
        setSongs((prev) => prev.filter((s) => s.id !== songId));
      }
    };
    const handleSongAdded = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { playlistId: addedPid, songId } = customEvent.detail;

      if (addedPid?.toString() === id?.toString()) {
        const newSong = await handleGetSongDetail(Number(songId));
        if (newSong) {
          setSongs((prev) => [newSong, ...prev]);
        }
      }
    };

    window.addEventListener("song-removed-from-playlist", handleSongRemoved);
    window.addEventListener("song-added-to-playlist", handleSongAdded);

    return () => {
      window.removeEventListener(
        "song-removed-from-playlist",
        handleSongRemoved,
      );
      window.removeEventListener("song-added-to-playlist", handleSongAdded);
    };
  }, [id]);

  if (!id) return <div className="p-8">未找到歌单 ID</div>;

  if (isLoading || !playlist) {
    return <PlaylistSkeleton />;
  }

  return (
    <div className="w-full h-full py-8 flex flex-col gap-8">
      <PlaylistPage
        playlist={playlist}
        songs={songs}
        isMyPlaylist={playlist.creator.userId === user?.userId}
        onRefresh={() => {}}
      />
    </div>
  );
}

export default function PlaylistDetailPage() {
  return (
    <Suspense fallback={<PlaylistSkeleton />}>
      <PlaylistContent />
    </Suspense>
  );
}
