import {
  ArrowClockwise24Regular,
  ArrowLeft20Regular,
  Dismiss24Regular,
  Maximize24Regular,
  Person20Regular,
  Person24Filled,
  SignOut20Regular,
  SquareMultiple24Regular,
  Subtract24Regular,
} from "@fluentui/react-icons";
import { Button } from "../ui/button";
import { useTitlebar } from "@/contexts/titlebar-context";
import { cn } from "@/lib/utils";
import { SearchInput } from "./search-input";
import { useAppWindow } from "@/hooks/use-app-window";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/use-navigation-history";
import { YeeButton } from "../yee-button";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { LogIn } from "lucide-react";
import { LoginForm } from "../modal/login-form";
import { LogoutForm } from "../modal/logout-form";

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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const user = useUserStore((state) => state.user);

  const lastClickTimeRef = useRef(0);

  return (
    <>
      <div
        className="w-full h-12 top-0 z-50 flex items-center pl-1"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (!e.currentTarget.contains(e.target as Node)) return;
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
          className="flex items-center gap-2 pl-2 flex-1 shrink-0 min-w-0"
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
              <span className="truncate font-normal text-[13px] text-foreground font-[微软雅黑]">
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
              className="cursor-pointer shrink-0 hover:bg-foreground/5 rounded-sm size-8 mr-4"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="cursor-pointer mr-4"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Avatar className="size-7 border border-border hover:scale-90 transition-transform duration-300">
                  <AvatarImage src={user?.avatarUrl} alt="1sen" />
                  <AvatarFallback>
                    <Person24Filled className="size-4" />
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              align="end"
              side="bottom"
              className="h-auto w-auto p-2 border border-border bg-card/80 backdrop-blur-md rounded-md"
            >
              {!user && (
                <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                  <LogIn />
                  登录
                </DropdownMenuItem>
              )}

              {!!user && (
                <>
                  <DropdownMenuItem>
                    <div className="flex gap-4 items-center pr-16">
                      <Avatar className="size-10 border border-border">
                        <AvatarImage src={user?.avatarUrl} alt="1sen" />
                        <AvatarFallback>
                          <Person20Regular />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold">{user.nickname}</span>
                        <span className="flex items-center text-xs text-foreground/60">
                          个人信息
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>

                  {/* <DropdownMenuItem>
                    <Ribbon20Regular />
                    我的会员
                  </DropdownMenuItem> */}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setIsLogoutOpen(true)}
                  >
                    <SignOut20Regular />
                    退出登录
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
      <LoginForm open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <LogoutForm open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
    </>
  );
}
