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
  Clock24Regular,
  Heart24Regular,
  Home24Regular,
  ListBar24Regular,
  PanelLeft24Regular,
  Home24Filled,
  Clock24Filled,
  Album24Filled,
  Heart24Filled,
  FluentIcon,
  Cloud24Regular,
  Cloud24Filled,
  MusicNote224Filled,
  List24Regular,
} from "@fluentui/react-icons";
import Link from "next/link";
import { useState } from "react";
import { LoginForm } from "./modal/login-form";
import { useUserStore } from "@/lib/store/userStore";
import { LogoutForm } from "./modal/logout-form";
import { usePathname } from "next/navigation";
import { Playlist } from "@/lib/types";

const mainItems = [
  {
    title: "主页",
    url: "/",
    icon: Home24Regular,
    activeIcon: Home24Filled,
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
    title: "我喜欢的音乐",
    url: "/favorite",
    icon: Heart24Regular,
    activeIcon: Heart24Filled,
  },
];

export function AppSidebar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  const createdPlaylists = useUserStore((s) => s.createdPlaylists);
  const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);

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

  const isPlaylistActive = (playlist: Playlist) => {
    return pathName === `/detail/playlist/${playlist.id}`;
  };

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between pt-2">
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
            <SidebarGroupLabel>播放列表</SidebarGroupLabel>
            <SidebarGroupContent>
              {playlistItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isItemActive(item)}
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

              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem key={"歌单"}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={"歌单"}>
                      <List24Regular />
                      <span>歌单</span>
                      <ChevronRight className="ml-auto transition-transform duraition-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {createdPlaylists.map((playlist) => (
                        <SidebarMenuItem key={playlist.id}>
                          <SidebarMenuButton
                            asChild
                            tooltip={playlist.name}
                            isActive={isPlaylistActive(playlist)}
                          >
                            <Link href={`/detail/playlist/${playlist.id}`}>
                              <div className="flex items-center gap-2">
                                <div className="size-6 relative rounded-sm overflow-hidden">
                                  <Image
                                    src={playlist.coverImgUrl}
                                    alt={`${playlist.name} 歌单封面`}
                                    fill
                                  />
                                </div>
                                <span>{playlist.name}</span>
                              </div>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                      {subscribedPlaylists.map((playlist) => (
                        <SidebarMenuItem key={playlist.id}>
                          <SidebarMenuButton
                            asChild
                            tooltip={playlist.name}
                            isActive={isPlaylistActive(playlist)}
                          >
                            <Link href={`/detail/playlist/${playlist.id}`}>
                              <div className="flex items-center gap-2">
                                <div className="size-6 relative rounded-sm overflow-hidden">
                                  <Image
                                    src={playlist.coverImgUrl}
                                    alt={`${playlist.name} 歌单封面`}
                                    fill
                                  />
                                </div>
                                <span>{playlist.name}</span>
                              </div>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
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
