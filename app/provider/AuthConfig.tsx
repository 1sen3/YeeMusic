"use client";

import { useUserStore } from "@/lib/store/userStore";
import { loginStatus } from "@/lib/services/auth";
import { useEffect } from "react";

export function AuthConfig() {
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);

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

  return null;
}
