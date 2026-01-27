"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface TitlebarContextType {
  title: string;
  setTitle: (title: string) => void;
  onRefresh: (() => void) | null;
  setOnRefresh: (callback: (() => void) | null) => void;
  isRefreshing: boolean;
  setIsRefreshing: (isRefreshing: boolean) => void;
}

const TitlebarContext = createContext<TitlebarContextType | undefined>(
  undefined,
);

export function TitlebarProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("主页");
  const [onRefresh, setOnRefresh] = useState<(() => void) | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 使用 useCallback 包装 setOnRefresh 来处理函数类型
  const handleSetOnRefresh = useCallback((callback: (() => void) | null) => {
    setOnRefresh(() => callback);
  }, []);

  return (
    <TitlebarContext.Provider
      value={{
        title,
        setTitle,
        onRefresh,
        setOnRefresh: handleSetOnRefresh,
        isRefreshing,
        setIsRefreshing,
      }}
    >
      {children}
    </TitlebarContext.Provider>
  );
}

export function useTitlebar() {
  const context = useContext(TitlebarContext);
  if (context === undefined) {
    throw new Error("useTitlebar must be used within a TitlebarProvider");
  }
  return context;
}
