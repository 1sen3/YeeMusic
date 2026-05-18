import {
  addSongToPlaylist,
  removeSongFromPlaylist,
} from "@/lib/services/playlist";
import { getSongDetail } from "@/lib/services/song";
import { likeSong } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { Resource, Song } from "@/lib/types";
import { toast } from "sonner";

export function useSongLogic() {
  const { likeListSet, toggleLikeMusic } = useUserStore();
  const playSong = usePlayerStore((s) => s.playSong);
  const addToPlaylist = usePlayerStore((s) => s.addToPlaylist);
  const favPlaylist = useUserStore((s) => s.favPlaylist);
  const favPlaylistId = favPlaylist?.id;

  const checkIsLiked = (type: string, data: any): boolean => {
    if (!data) return false;
    if (type === "song") {
      return likeListSet.has(Number((data as Song).id));
    }
    if (type === "resource") {
      return likeListSet.has(Number((data as Resource).resourceId));
    }
    return false;
  };

  const handleLike = async (type: string, data: any) => {
    if ((type !== "song" && type !== "resource") || !data) return;

    const songId =
      Number((data as Song).id) || Number((data as Resource).resourceId);
    const isLiked = checkIsLiked(type, data);
    const targetState = !isLiked;

    toggleLikeMusic(songId, targetState);

    try {
      const res = await likeSong(songId, targetState);

      if (!res) {
        toggleLikeMusic(songId, isLiked);
        toast.error("操作失败，请重试...", { position: "top-center" });
      } else {
        if (!targetState) {
          window.dispatchEvent(
            new CustomEvent("song-removed-from-playlist", {
              detail: { playlistId: favPlaylistId, songId: songId },
            }),
          );
        } else {
          window.dispatchEvent(
            new CustomEvent("song-added-to-playlist", {
              detail: { playlistId: favPlaylistId, songId: songId },
            }),
          );
        }
      }
    } catch (err) {
      toggleLikeMusic(songId, isLiked);
      toast.error("操作失败，请重试...", { position: "top-center" });
      console.log("切换歌曲喜欢状态失败", err);
    }
  };

  const handlePlay = async (data: any) => {
    let targetSong = data as Song;
    const resourceId = (data as any).id || (data as any).resourceId;

    if (!(data as Song).al && resourceId) {
      const res = await getSongDetail([resourceId]);
      if (res && res.length > 0) {
        targetSong = res[0];
      }
    }
    if (targetSong) {
      playSong(targetSong);
    }
  };

  const handleNextPlay = async (data: any) => {
    let targetSong = data as Song;
    const resourceId = (data as any).id || (data as any).resourceId;

    if (!(data as Song).al && resourceId) {
      const res = await getSongDetail([resourceId]);
      if (res && res.length > 0) {
        targetSong = res[0];
      }
    }
    if (targetSong) {
      addToPlaylist(targetSong);
    }
  };

  const handleAddToPlaylist = async (pid: number, data: any) => {
    const resourceId = (data as any).id || (data as any).resourceId;

    if (!resourceId) return;

    try {
      const res = addSongToPlaylist(pid, [resourceId]);

      if (!res) {
        toast.error("添加失败，请重试...", { position: "top-center" });
      } else {
        toast.success("成功添加到歌单！", { position: "top-right" });
        window.dispatchEvent(
          new CustomEvent("song-added-to-playlist", {
            detail: { playlistId: pid, songId: resourceId },
          }),
        );
      }
    } catch (error) {
      toast.error("添加失败，请重试...", { position: "top-center" });
      console.log("添加歌曲到歌单失败", error);
    }
  };

  const handleRemoveFromPlaylist = async (pid: number, data: any) => {
    const resourceId = (data as any).id || (data as any).resourceId;

    if (!resourceId) return;

    try {
      const res = removeSongFromPlaylist(pid, [resourceId]);

      if (!res) {
        toast.error("移除失败，请重试...", { position: "top-center" });
      } else {
        window.dispatchEvent(
          new CustomEvent("song-removed-from-playlist", {
            detail: { playlistId: pid, songId: resourceId },
          }),
        );
      }
    } catch (error) {
      toast.error("移除失败，请重试...", { position: "top-center" });
      console.log("从歌单移除歌曲失败", error);
    }
  };

  const handleGetSongDetail = async (songId: number) => {
    try {
      const res = await getSongDetail([songId]);
      if (res && res.length > 0) {
        return res[0];
      }
    } catch (error) {
      console.log("获取歌曲详情失败", error);
    }
    return null;
  };

  return {
    checkIsLiked,
    handleLike,
    handlePlay,
    handleNextPlay,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
    handleGetSongDetail,
  };
}
