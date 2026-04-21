import {
  ArrowClockwise24Regular,
  ArrowLeft20Regular,
  Dismiss24Regular,
  Maximize24Regular,
  Navigation20Regular,
  SquareMultiple24Regular,
  Subtract24Regular,
} from "@fluentui/react-icons";
import { Button } from "../ui/button";
import { useTitlebar } from "@/contexts/titlebar-context";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";
import { useAppWindow } from "@/hooks/use-app-window";
import { useSidebar } from "../ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { YeeButton } from "../yee-button";
import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function Titlebar() {
  const navigate = useNavigate();
  const { canGoBack } = useNavigationHistory();
  const { onRefresh, isRefreshing } = useTitlebar();
  const { minimize, toogleMaximize, close, isMaximized, startDragging } =
    useAppWindow();

  const handleRefresh = () => {
    if (onRefresh && !isRefreshing) {
      onRefresh();
    }
  };

  const MaxmizeIcon = isMaximized ? SquareMultiple24Regular : Maximize24Regular;

  const { toggleSidebar } = useSidebar();

  const lastClickTimeRef = useRef(0);

  return (
    <div
      className="w-full h-12 top-0 z-50 flex items-center pr-0"
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastClickTimeRef.current;
        if (timeDiff < 300) {
          toogleMaximize();
          lastClickTimeRef.current = 0;
        } else {
          lastClickTimeRef.current = currentTime;
          startDragging();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <motion.div
        layout
        className="flex items-center gap-2 pl-3 flex-1 shrink-0 min-w-0"
      >
        <AnimatePresence mode="popLayout">
          {canGoBack && (
            <motion.div
              key="back-button"
              initial={{ opacity: 0, x: -12, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="shrink-0"
            >
              <YeeButton
                variant="ghost"
                className="cursor-pointer shrink-0 hover:bg-foreground/5 rounded-sm size-8 -ml-0.5"
                icon={<ArrowLeft20Regular className="size-4" />}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => navigate(-1)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex items-center gap-2"
        >
          <YeeButton
            variant="ghost"
            className="cursor-pointer shrink-0 hover:bg-foreground/5 rounded-sm size-8 -ml-0.5"
            icon={<Navigation20Regular className="size-4" />}
            onClick={toggleSidebar}
            onMouseDown={(e) => e.stopPropagation()}
          />

          <div className="flex items-center gap-2 truncate group-data-[collapsible=icon]:hidden shrink-0">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
              <img
                src="/icons/logo.png"
                alt="Yee Music Logo"
                width={20}
                height={20}
                className="rounded-sm"
              />
            </div>
            <span className="truncate font-light text-sm text-foreground">
              Yee Music
            </span>
          </div>
        </motion.div>
      </motion.div>

      <div className="flex flex-1 justify-center shrink-0 min-w-50">
        <div onMouseDown={(e) => e.stopPropagation()}>
          <SearchInput />
        </div>
      </div>

      <div className="flex items-center justify-end flex-1 shrink-0">
        {onRefresh && (
          <YeeButton
            variant="ghost"
            className="cursor-pointer shrink-0 hover:bg-foreground/5 rounded-sm size-8 mr-2"
            icon={
              <ArrowClockwise24Regular
                className={cn(isRefreshing && "animate-spin")}
              />
            }
            onClick={handleRefresh}
            disabled={isRefreshing}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )}
        <Button
          className="cursor-pointer size-12 rounded-none border-0 hover:bg-black/5"
          variant="ghost"
          size="icon"
          onClick={minimize}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Subtract24Regular className="size-4" />
        </Button>
        <Button
          className="cursor-pointer size-12 rounded-none border-0 hover:bg-black/5"
          variant="ghost"
          size="icon"
          onClick={toogleMaximize}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <MaxmizeIcon className="size-4" />
        </Button>
        <Button
          className="cursor-pointer size-12 rounded-tr-lg rounded-none hover:bg-destructive hover:text-white border-0"
          variant="ghost"
          size="icon"
          onClick={close}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Dismiss24Regular className="size-4" />
        </Button>
      </div>
    </div>
  );
}
