import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";

import {
  FluentIcon,
  Settings20Regular,
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
  Cloud20Filled,
  Add20Regular,
  List24Regular,
} from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { useLocation, useSearchParams } from "react-router-dom";
import { Playlist } from "@/lib/types";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { PlaylistAddForm } from "./modal/playlist-add-form";
import { toast } from "sonner";

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
    title: "下载",
    url: "/library/download",
    icon: ArrowDownload20Regular,
    activeIcon: ArrowDownload20Filled,
  },
  {
    title: "本地歌曲",
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
  const isLoggedin = useUserStore((s) => s.isLoggedin);

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

  const favPlaylist = useUserStore((s) => s.favPlaylist);
  const favPlaylistUrl = `/detail/playlist?id=${favPlaylist?.id}`;

  const [isPlaylistAddOpen, setIsPlaylistAddOpen] = useState(false);

  const createdPlaylists = useUserStore((s) => s.createdPlaylists);
  const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);

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
            <SidebarGroupContent className="-mt-2">
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Link to={item.url} draggable={false}>
                      <SidebarMenuButton
                        isActive={isItemActive(item)}
                        label={item.title}
                        icon={
                          isItemActive(item) ? (
                            <item.activeIcon className="size-5 text-primary" />
                          ) : (
                            <item.icon className="size-5 " />
                          )
                        }
                      ></SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-2! w-auto!" />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {libraryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Link
                      to={item.url}
                      draggable={false}
                      onClick={(e) => {
                        if (item.title === "最近播放" && !isLoggedin) {
                          e.preventDefault();
                          toast.error("请先登录网易云账号");
                        }
                      }}
                    >
                      <SidebarMenuButton
                        isActive={isItemActive(item)}
                        label={item.title}
                        icon={
                          isItemActive(item) ? (
                            <item.activeIcon className="size-5 text-primary" />
                          ) : (
                            <item.icon className="size-5 " />
                          )
                        }
                      ></SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className="mx-2! w-auto!" />

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenuItem>
                <Link
                  to={favPlaylistUrl}
                  draggable={false}
                  onClick={(e) => {
                    if (!isLoggedin) {
                      e.preventDefault();
                      toast.error("请先登录网易云账号");
                    }
                  }}
                >
                  <SidebarMenuButton
                    className="cursor-pointer"
                    isActive={
                      (favPlaylist && isPlaylistActive(favPlaylist)) || false
                    }
                    icon={
                      pathName === "/detail/playlist" ||
                      (pathName === "/detail/playlist/" &&
                        currentId === favPlaylist?.id.toString()) ? (
                        <Heart20Filled className="size-5 text-primary" />
                      ) : (
                        <Heart20Regular className="size-5" />
                      )
                    }
                    label={"喜爱歌曲"}
                  ></SidebarMenuButton>
                </Link>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger asChild>
                    <SidebarMenuButton
                      icon={<List24Regular />}
                      label="歌单"
                    ></SidebarMenuButton>
                  </PopoverTrigger>
                  <PopoverContent
                    side="right"
                    className="bg-card/80 backdrop-blur-md"
                  >
                    <div
                      className="flex items-center gap-2 hover:bg-foreground/5 rounded-sm p-2 select-none cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isLoggedin) {
                          toast.error("暂不支持创建本地歌单，请登录后重试");
                          return;
                        }

                        setIsPlaylistAddOpen(true);
                      }}
                    >
                      <div className="size-6 relative rounded-sm overflow-hidden shrink-0 flex items-center justify-center">
                        <Add20Regular className="size-4!" />
                      </div>
                      <span className="text-sm text-foreground/60">
                        新建歌单
                      </span>
                    </div>

                    {createdPlaylists.map((playlist) => (
                      <div className="p-2 rounded-sm select-none cursor-pointer hover:bg-foreground/5">
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
                      </div>
                    ))}

                    {subscribedPlaylists.map((playlist) => (
                      <div className="p-2 rounded-sm select-none cursor-pointer hover:bg-foreground/5">
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
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link to={"/setting"} draggable={false}>
                <SidebarMenuButton
                  isActive={pathName === "/setting"}
                  icon={<Settings20Regular />}
                  label={"设置"}
                ></SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <PlaylistAddForm
        open={isPlaylistAddOpen}
        onOpenChange={setIsPlaylistAddOpen}
      />
    </>
  );
}
