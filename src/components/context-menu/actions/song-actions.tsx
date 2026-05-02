import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { ActionProps } from "./action";
import { useSongLogic } from "@/hooks/use-song-logic";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/lib/store/userStore";
import {
  ContextMenuButton,
  ContextMenuSeperator,
} from "../context-menu-button";
import {
  Album24Regular,
  ArrowDownload24Regular,
  Collections24Regular,
  Delete24Regular,
  Person24Regular,
  Play24Filled,
  TextBulletListAdd24Regular,
} from "@fluentui/react-icons";
import { Resource, Song } from "@/lib/types";
import { QUALITY_LIST } from "@/lib/constants/song";
import { useDownloadStore } from "@/lib/store/downloadStore";

export function SongActions({ type, data }: ActionProps) {
  const { closeMenu } = useContextMenuStore();
  const {
    handleLike,
    handlePlay,
    handleNextPlay,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
  } = useSongLogic();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const { isInPlaylist } = usePlayerStore();
  const navigate = useNavigate();
  const playlistList = useUserStore((s) => s.playlistList);

  if (type !== "song" && data.resourceType !== "song") return null;

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get("id");

  const favPlaylist = useUserStore((s) => s.favPlaylist);
  const createdPlaylists = useUserStore((s) => s.createdPlaylists);

  const isPlaylistPage = location.pathname.includes("/playlist");
  const isFavPlaylist = playlistId === favPlaylist?.id?.toString();

  const isMyPalylistPage =
    isPlaylistPage &&
    playlistId &&
    (isFavPlaylist ||
      createdPlaylists.some((pl) => pl.id.toString() === playlistId));

  const startDownload = useDownloadStore((s) => s.startDownload);
  const downloadedSongs = useDownloadStore((s) => s.downloadedSongs);

  const isDownloaded = downloadedSongs.some(
    (item) => item.song.id === (data as Song).id,
  );

  const artistStr =
    (data as Song).ar?.[0]?.name ||
    (data as Resource).resourceExtInfo.artists?.[0]?.name;
  const albumStr = (data as Song).al?.name;

  return (
    <>
      {(!currentSong || currentSong?.id !== (data as Song).id) && (
        <ContextMenuButton
          id="play-music"
          icon={<Play24Filled className="size-4" />}
          content="播放"
          onClick={() => {
            closeMenu();
            handlePlay(data);
          }}
        />
      )}

      {!isInPlaylist({
        id: (data as any).id || (data as any).resourceId,
      } as Song) && (
        <>
          <ContextMenuButton
            id="add-to-playlist"
            icon={<TextBulletListAdd24Regular className="size-4" />}
            content="加入播放列表"
            onClick={async () => {
              closeMenu();
              handleNextPlay(data);
            }}
          />
          <ContextMenuSeperator />
        </>
      )}

      <ContextMenuButton
        id="collect-music"
        icon={<Collections24Regular className="size-4" />}
        content="收藏"
        hasSubmenu={true}
      >
        {playlistList.map((playlist) => (
          <ContextMenuButton
            id={`collect-music-${playlist.id}`}
            key={playlist.id}
            content={playlist.name}
            onClick={() => {
              closeMenu();
              handleAddToPlaylist(playlist.id, data);
            }}
          />
        ))}
      </ContextMenuButton>

      {!isDownloaded && type === "song" && (
        <ContextMenuButton
          id="download-music"
          icon={<ArrowDownload24Regular className="size-4" />}
          content="下载"
          hasSubmenu={true}
        >
          {QUALITY_LIST.filter(
            (q) => q.key !== "unlock" && (data as Song)[q.key as keyof Song],
          ).map((q) => (
            <ContextMenuButton
              id={`download-music-${q.level}`}
              key={q.level}
              content={q.desc}
              onClick={() => {
                closeMenu();
                startDownload(data as Song, q.level);
              }}
            />
          ))}
        </ContextMenuButton>
      )}

      <ContextMenuSeperator />

      <ContextMenuButton
        id="artist-info"
        icon={<Person24Regular className="size-4" />}
        content={
          <div className="flex flex-col">
            <span>前往艺人</span>
            <span className="line-clamp-1 text-foreground/50">{artistStr}</span>
          </div>
        }
        onClick={() => {
          navigate(
            `/detail/artist?id=${(data as Song).ar?.[0]?.id}|| (data as Resource).resourceExtInfo.artists?.[0]?.id}`,
          );
          closeMenu();
        }}
      />

      {(data as Song).al && (
        <ContextMenuButton
          id="album-info"
          icon={<Album24Regular className="size-4" />}
          content={
            <div className="flex flex-col">
              <span>前往专辑</span>
              <span className="line-clamp-1 text-foreground/50">
                {albumStr}
              </span>
            </div>
          }
          onClick={() => {
            navigate(`/detail/album?id=${(data as Song).al?.id}`);
            closeMenu();
          }}
        />
      )}

      {isMyPalylistPage && (
        <>
          <ContextMenuSeperator />

          <ContextMenuButton
            id="remove-from-playlist"
            icon={<Delete24Regular className="size-4 text-destructive" />}
            content={<span className="text-destructive">从歌单中移除</span>}
            onClick={() => {
              closeMenu();
              if (isFavPlaylist) {
                console.log("isLikelist");
                handleLike("song", data);
              } else {
                console.log("isNotLikelist");
                handleRemoveFromPlaylist(Number(playlistId), data);
              }
            }}
          />
        </>
      )}
    </>
  );
}
