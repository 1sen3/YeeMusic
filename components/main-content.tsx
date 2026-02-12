"use client";

import { usePlayerStore } from "@/lib/store/playerStore";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function getHasSong() {
  return usePlayerStore.getState().currentSong !== null;
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const [hasSong, setHasSong] = useState(false);

  useEffect(() => {
    // mount 后同步 persist 恢复的状态
    const current = getHasSong();
    if (current !== hasSong) setHasSong(current);

    const unsub = usePlayerStore.subscribe(
      (state) => state.currentSong,
      (currentSong) => setHasSong(currentSong !== null),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("w-full flex flex-col", hasSong && "pb-24")}>
      {children}
    </div>
  );
}
