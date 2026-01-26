'use client'

import { useUserStore } from "@/lib/store/userStore"
import { useEffect } from "react";

export function AuthConfig() {
  const setUser = useUserStore(state => state.setUser);

  useEffect(() => {
    const storedUser = localStorage.getItem("userInfo");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user info', e);
      }
    }
  }, [setUser])

  return null;
}