'use client'

import { Album, BookUser, ChevronRight, ChevronUp, Clock, Grid3X3, Home, LayoutGrid, LogIn, LogOut, MicVocal, Music, PanelLeftClose, Pin, Radio, Search, Settings, Star, User, User2 } from "lucide-react"
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarProvider, SidebarSeparator, useSidebar } from "./ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Person24Regular, Album24Regular, Apps24Regular, Clock24Regular, Communication24Regular, Heart24Regular, Home24Regular, Home28Regular, ListBar24Regular, MusicNote124Regular, MusicNote224Regular, PanelLeft24Regular, PersonStar24Regular, Pin24Regular, Search24Regular } from "@fluentui/react-icons";
import Link from "next/link";
import { useState } from "react";
import { LoginForm } from "./login-form";

const mainItems = [
  {
    title: "主页",
    url: "/",
    icon: Home24Regular
  },
  {
    title: "新发现",
    url: "#",
    icon: Apps24Regular
  },
  {
    title: "广播",
    url: "#",
    icon: Communication24Regular
  }
]

const libraryItems = [
  {
    title: "最近添加",
    url: "#",
    icon: Clock24Regular
  },
  {
    title: "艺人",
    url: "#",
    icon: PersonStar24Regular
  },
  {
    title: "专辑",
    url: "#",
    icon: Album24Regular
  },
  {
    title: "歌曲",
    url: '#',
    icon: MusicNote224Regular
  }, {
    title: "专属推荐",
    url: '#',
    icon: PersonStar24Regular
  }
]

const playlistItems = [
  {
    title: "所有播放列表",
    url: "#",
    icon: ListBar24Regular
  }, {
    title: "喜爱歌曲",
    url: '#',
    icon: Heart24Regular
  }
]

export function AppSidebar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center justify-between  py-2">
                <div className="flex items-center gap-2 truncate group-data-[collapsible=icon]:hidden">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image src="/icons/logo.png" alt="Yee Music Logo" width={20} height={20} className="rounded-sm" />
                  </div>
                  <span className="truncate font-bold text-lg">Yee Music</span>
                </div>
                <SidebarMenuButton onClick={toggleSidebar} className="h-8 w-8 group-[collapsible=icon]:hidden" tooltip="折叠侧边栏">
                  <PanelLeft24Regular className="h-4 w-4" />
                </SidebarMenuButton>
              </div>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <form className="group-data-[collapsible=icon]:hidden relative">
                <Search24Regular className="absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
                <SidebarInput placeholder="搜索..." className="pl-8" />
              </form>

              <SidebarMenuButton className="hidden group-data-[collapsible=icon]:flex" tooltip="搜索">
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
                {mainItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.title === "主页"} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="size-5" />
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
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem key={"置顶内容"}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={"置顶内容"}>
                        <Pin24Regular />
                        <span>置顶内容</span>
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

                {libraryItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
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
              {
                playlistItems.map(item => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              }
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <Avatar className="size-6">
                      <AvatarImage alt="1sen" />
                      <AvatarFallback>
                        <Person24Regular />
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-2">未登录</span>
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width] h-auto">
                  <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                    <LogIn />
                    登录
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <User />
                    个人信息
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings />
                    设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    <LogOut />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar >

      <LoginForm open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  )
}