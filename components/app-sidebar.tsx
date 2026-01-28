"use client";

import {
  ChevronRight,
  ChevronUp,
  LogIn,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  Person24Regular,
  Album24Regular,
  Apps24Regular,
  Clock24Regular,
  Communication24Regular,
  Heart24Regular,
  Home24Regular,
  ListBar24Regular,
  MusicNote224Regular,
  PanelLeft24Regular,
  PersonStar24Regular,
  Pin24Regular,
  Search24Regular,
  Home24Filled,
  Apps24Filled,
  Communication24Filled,
  Clock24Filled,
  PersonStar24Filled,
  Album24Filled,
  MusicNote224Filled,
  Heart24Filled,
  FluentIcon,
  Cloud24Regular,
  Cloud24Filled,
} from "@fluentui/react-icons";
import Link from "next/link";
import { useState } from "react";
import { LoginForm } from "./login-form";
import { useUserStore } from "@/lib/store/userStore";
import { LogoutForm } from "./logout-form";
import { usePathname } from "next/navigation";

const mainItems = [
  {
    title: "主页",
    url: "/",
    icon: Home24Regular,
    activeIcon: Home24Filled,
  },
  {
    title: "新发现",
    url: "/new",
    icon: Apps24Regular,
    activeIcon: Apps24Filled,
  },
  {
    title: "广播",
    url: "/broadcast",
    icon: Communication24Regular,
    activeIcon: Communication24Filled,
  },
];

const libraryItems = [
  {
    title: "最近播放",
    url: "/library/recent",
    icon: Clock24Regular,
    activeIcon: Clock24Filled,
  },
  {
    title: "专辑",
    url: "/library/album",
    icon: Album24Regular,
    activeIcon: Album24Filled,
  },
  {
    title: "网盘",
    url: "/library/cloud",
    icon: Cloud24Regular,
    activeIcon: Cloud24Filled,
  },
];

const playlistItems = [
  {
    title: "喜欢歌曲",
    url: "#",
    icon: Heart24Regular,
    activeIcon: Heart24Filled,
  },
];

export function AppSidebar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  const user = useUserStore((state) => state.user);
  const pathName = usePathname();
  const isItemActive = (item: {
    title: string;
    url: string;
    icon: FluentIcon;
    activeIcon: FluentIcon;
  }) => {
    if (item.url && item.url != "#") {
      return pathName === item.url || pathName.startsWith(item.url + "/");
    }

    return false;
  };

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between  py-2">
                <div className="flex items-center gap-2 truncate group-data-[collapsible=icon]:hidden">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image
                      src="/icons/logo.png"
                      alt="Yee Music Logo"
                      width={20}
                      height={20}
                      className="rounded-sm"
                    />
                  </div>
                  <span className="truncate font-semibold text-md">
                    Yee Music
                  </span>
                </div>
                <SidebarMenuButton
                  onClick={toggleSidebar}
                  className="h-8 w-8 group-[collapsible=icon]:hidden cursor-pointer"
                  tooltip="折叠侧边栏"
                >
                  <PanelLeft24Regular className="h-4 w-4" />
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <form className="group-data-[collapsible=icon]:hidden relative">
                <Search24Regular className="absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
                <SidebarInput placeholder="搜索..." className="pl-8" />
              </form>

              <SidebarMenuButton
                className="hidden group-data-[collapsible=icon]:flex cursor-pointer"
                tooltip="搜索"
                onClick={() => {
                  toggleSidebar();
                  setTimeout(() => {
                    const input = document.querySelector(
                      '[data-sidebar="input"]',
                    ) as HTMLInputElement;
                    input?.focus();
                  }, 100);
                }}
              >
                <Search24Regular />
                <span className="sr-only">搜索</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive(item)}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        {isItemActive(item) ? (
                          <item.activeIcon className="size-5 text-red-500" />
                        ) : (
                          <item.icon className="size-5" />
                        )}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-2! w-auto!" />

          <SidebarGroup>
            <SidebarGroupLabel>资料库</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {libraryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isItemActive(item)}
                    >
                      <a href={item.url}>
                        {isItemActive(item) ? (
                          <item.activeIcon className="size-5 text-red-500" />
                        ) : (
                          <item.icon className="size-5" />
                        )}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-2! w-auto!" />

          <SidebarGroup>
            <SidebarGroupLabel>播放列表</SidebarGroupLabel>
            <SidebarGroupContent>
              {playlistItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isItemActive(item)}
                  >
                    <a href={item.url}>
                      {isItemActive(item) ? (
                        <item.activeIcon className="size-5 text-red-500" />
                      ) : (
                        <item.icon className="size-5" />
                      )}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem key={"创建的歌单"}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={"创建的歌单"}>
                      <ListBar24Regular />
                      <span>创建的歌单</span>
                      <ChevronRight className="ml-auto transition-transform duraition-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem />
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="size-6 -ml-0.5">
                      <AvatarImage src={user?.avatarUrl} alt="1sen" />
                      <AvatarFallback>
                        <Person24Regular />
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-1">{user?.nickname || "未登录"}</span>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width] h-auto"
                >
                  {!user && (
                    <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                      <LogIn />
                      登录
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem>
                    <Settings />
                    设置
                  </DropdownMenuItem>

                  {!!user && (
                    <>
                      <DropdownMenuItem>
                        <User />
                        个人信息
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setIsLogoutOpen(true)}
                      >
                        <LogOut />
                        退出登录
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <LoginForm open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <LogoutForm open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
    </>
  );
}
