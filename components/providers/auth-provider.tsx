"use client";

import { useUserStore } from "@/lib/store/userStore";
import { loginStatus } from "@/lib/services/auth";
import { useEffect } from "react";
import {
  getUserLikeArtists,
  getUserLikeList,
  getUserPlaylists,
} from "@/lib/services/user";

export function AuthConfig() {
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const setLikeList = useUserStore((state) => state.setLikeList);
  const setPlaylistList = useUserStore((state) => state.setPlaylistList);

  useEffect(() => {
    if (user) return;

    const restoreLoginStatus = async () => {
      const storedUser = localStorage.getItem("userInfo");
      const cookie = localStorage.getItem("cookie");

      // 优先从 localStorage 恢复
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          return;
        } catch (e) {
          console.error("Failed to parse user info", e);
          localStorage.removeItem("userInfo");
        }
      }

      // 如果没有 userInfo 但有 cookie，从 API 获取
      if (cookie) {
        try {
          const res = await loginStatus();
          if (res.code === 200 && res.profile) {
            setUser(res.profile);
          }
        } catch (error) {
          console.error("获取登录状态失败:", error);
        }
      }
    };

    restoreLoginStatus();
  }, [setUser, user]);

  // 获取用户喜欢音乐列表
  useEffect(() => {
    async function fetchLikeSong() {
      if (!user) return;

      try {
        const res = await getUserLikeList(user.userId);

        if (res.code === 200) {
          setLikeList(res.ids);
        }
      } catch (error) {
        console.error("获取用户喜欢音乐列表失败:", error);
      }
    }

    fetchLikeSong();
  }, [user, setLikeList]);

  // 获取用户歌单列表
  useEffect(() => {
    async function fetchPlaylists() {
      if (!user) return;

      try {
        const res = await getUserPlaylists(user.userId);
        setPlaylistList(res.playlist);
      } catch (err) {
        console.error("获取用户歌单失败:", err);
      }
    }

    fetchPlaylists();
  }, [user, setPlaylistList]);

  return null;
}
