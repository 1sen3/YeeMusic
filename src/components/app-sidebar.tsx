import { LogIn } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
} from "./ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  Person20Regular,
  FluentIcon,
  Settings20Regular,
  SignOut20Regular,
  PersonEdit20Regular,
  Ribbon20Regular,
  Home20Regular,
  Home20Filled,
  ArrowDownload20Regular,
  ArrowDownload20Filled,
  Folder20Regular,
  Folder20Filled,
  Clock20Regular,
  Clock20Filled,
  Cloud20Regular,
  Heart20Filled,
  Heart20Regular,
  List20Regular,
  Cloud20Filled,
  Add20Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { LoginForm } from "./modal/login-form";
import { useUserStore } from "@/lib/store/userStore";
import { LogoutForm } from "./modal/logout-form";
import { useLocation, useSearchParams } from "react-router-dom";
import { Playlist } from "@/lib/types";
import { PlaylistAddForm } from "./modal/playlist-add-form";

const mainItems = [
  {
    title: "主页",
    url: "/",
    icon: Home20Regular,
    activeIcon: Home20Filled,
  },
];

const libraryItems = [
  {
    title: "最近播放",
    url: "/library/recent",
    icon: Clock20Regular,
    activeIcon: Clock20Filled,
  },
  {
    title: "下载管理",
    url: "/library/download",
    icon: ArrowDownload20Regular,
    activeIcon: ArrowDownload20Filled,
  },
  {
    title: "本地音乐",
    url: "/library/local",
    icon: Folder20Regular,
    activeIcon: Folder20Filled,
  },
  {
    title: "网盘",
    url: "/library/cloud",
    icon: Cloud20Regular,
    activeIcon: Cloud20Filled,
  },
];

export function AppSidebar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isPlaylistAddOpen, setIsPlaylistAddOpen] = useState(false);

  const createdPlaylists = useUserStore((s) => s.createdPlaylists);
  const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);

  const user = useUserStore((state) => state.user);

  const location = useLocation();
  const pathName = location.pathname;
  const [searchParams] = useSearchParams();
  const currentId = searchParams.get("id");

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
    const isMatchedPath =
      pathName === "/detail/playlist" || pathName === "/detail/playlist/";
    return isMatchedPath && currentId === String(playlist.id);
  };

  const navigate = useNavigate();

  const favPlaylist = useUserStore((s) => s.favPlaylist);
  const favPlaylistUrl = `/detail/playlist?id=${favPlaylist?.id}`;

  return (
    <>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="absolute! h-full!"
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isItemActive(item)}>
                      <Link to={item.url}>
                        {isItemActive(item) ? (
                          <item.activeIcon className="size-5 text-primary" />
                        ) : (
                          <item.icon className="size-5 " />
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
                    <SidebarMenuButton asChild isActive={isItemActive(item)}>
                      <Link to={item.url}>
                        {isItemActive(item) ? (
                          <item.activeIcon className="size-5 text-primary" />
                        ) : (
                          <item.icon className="size-5 " />
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-pointer"
                  asChild
                  isActive={
                    (favPlaylist && isPlaylistActive(favPlaylist)) || false
                  }
                >
                  <Link to={favPlaylistUrl}>
                    {pathName === "/detail/playlist" ||
                    (pathName === "/detail/playlist/" &&
                      currentId === favPlaylist?.id.toString()) ? (
                      <Heart20Filled className="size-5 text-primary" />
                    ) : (
                      <Heart20Regular className="size-5" />
                    )}
                    <span>我喜欢的音乐</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible defaultOpen className="group/collapsible py-1">
                <SidebarMenuItem key={"歌单"}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <List20Regular />
                      <span>歌单</span>
                      <ChevronRight24Regular className="size-4! ml-auto transition-transform duraition-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          className="cursor-pointer"
                          onClick={() => setIsPlaylistAddOpen(true)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="size-6 relative rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                              <Add20Regular className="size-4!" />
                            </div>
                            <span className="text-sm text-foreground/60">
                              新建歌单
                            </span>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      {createdPlaylists.map((playlist) => (
                        <SidebarMenuItem key={playlist.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={isPlaylistActive(playlist)}
                          >
                            <Link to={`/detail/playlist?id=${playlist.id}`}>
                              <div className="flex items-center gap-2">
                                <div className="size-6 relative rounded-sm overflow-hidden">
                                  <img
                                    src={playlist.coverImgUrl}
                                    alt={`${playlist.name} 歌单封面`}
                                    className="size-6"
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
                            isActive={isPlaylistActive(playlist)}
                          >
                            <Link to={`/detail/playlist?id=${playlist.id}`}>
                              <div className="flex items-center gap-2">
                                <div className="size-6 relative rounded-sm overflow-hidden shrink-0">
                                  <img
                                    src={playlist.coverImgUrl}
                                    alt={`${playlist.name} 歌单封面`}
                                    className="size-6"
                                  />
                                </div>
                                <span className="line-clamp-1">
                                  {playlist.name}
                                </span>
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
                  <SidebarMenuButton className="cursor-pointer">
                    <Avatar className="size-6 -ml-0.5">
                      <AvatarImage src={user?.avatarUrl} alt="1sen" />
                      <AvatarFallback>
                        <Person20Regular />
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-1">{user?.nickname || "未登录"}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="h-auto ">
                  {!user && (
                    <DropdownMenuItem onClick={() => setIsLoginOpen(true)}>
                      <LogIn />
                      登录
                    </DropdownMenuItem>
                  )}

                  {!!user && (
                    <>
                      <DropdownMenuItem>
                        <Ribbon20Regular />
                        我的会员
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          navigate("/profile");
                        }}
                      >
                        <PersonEdit20Regular />
                        个人信息
                      </DropdownMenuItem>

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
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathName === "/setting"}>
                <Link to={"/setting"}>
                  <Settings20Regular />
                  <span>设置</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <LoginForm open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <LogoutForm open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
      <PlaylistAddForm
        open={isPlaylistAddOpen}
        onOpenChange={setIsPlaylistAddOpen}
      />
    </>
  );
}
