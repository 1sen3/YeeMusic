import { getSongDetail } from "@/lib/services/song";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Resource } from "@/lib/types";
import { GetThumbnail, cn } from "@/lib/utils";
import {
  Heart24Filled,
  Heart24Regular,
  MoreHorizontal24Regular,
  Play24Filled,
} from "@fluentui/react-icons";
import { Link } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { useSongLogic } from "@/hooks/use-song-logic";
import { YeeButton } from "../yee-button";

export function SongPreview({ resources }: { resources: Resource[] }) {
  return (
    <div className="flex flex-col gap-6 basis-[calc((100%-1rem)/2)]">
      {resources.map((res) => (
        <SongPreviewItem resource={res} key={res.resourceId} />
      ))}
    </div>
  );
}

export function SongPreviewItem({ resource }: { resource: Resource }) {
  const { checkIsLiked, handleLike } = useSongLogic();
  const isLiked = checkIsLiked("resource", resource);
  const LikeIcon = isLiked ? Heart24Filled : Heart24Regular;

  const uiElement = resource?.uiElement;
  const resourceExtInfo = resource?.resourceExtInfo;
  const title =
    uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "默认标题";
  const artists = resourceExtInfo?.artists || [];
  const cover = uiElement?.image?.imageUrl || "";

  const { playSong } = usePlayerStore();

  async function handlePlay() {
    const songId = resource.resourceId;
    if (!songId) return;

    const res = await getSongDetail([songId]);
    if (res && res.length > 0) {
      playSong(res[0]);
    }
  }

  const openMenu = useContextMenuStore((s) => s.openMenu);

  return (
    <div
      className={cn("flex gap-4 justify-between group")}
      onContextMenu={(e) => {
        e.preventDefault();
        openMenu(e.clientX, e.clientY, "resource", resource);
      }}
    >
      <div
        className="w-16 h-16 rounded-sm overflow-hidden relative cursor-pointer border"
        onClick={handlePlay}
      >
        <img
          loading="lazy"
          src={GetThumbnail(cover)}
          alt="Album cover"
          className="object-cover group-hover:brightness-50 transform transition-all duration-300 ease-in-out"
        />

        <div className="cursor-pointer opacity-0 group-hover:opacity-100 bg-black/50 absolute top-0 left-0 w-full h-full flex items-center justify-center  text-foreground transform transition-all duration-300 ease-in-out">
          <Play24Filled
            width={24}
            height={24}
            className="hover:scale-110 transition-transform text-white"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 justify-center">
        <span className="text-sm font-medium">{title}</span>
        <div className="line-clamp-1">
          {artists.map((ar, idx) => (
            <Link to={`/detail/artist?id=${ar.id}`} key={`${ar.id}-${idx}`}>
              <span className="text-sm text-foreground/60 hover:text-foreground/80">
                {ar.name}
                {idx < artists.length - 1 && "、"}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 pr-8 translate-x-20 group-hover:translate-x-0 transform transition-all duration-300 ease-in-out">
        {/*<ArrowDownload24Regular className="size-5 text-foreground cursor-pointer hover:text-foreground/80" />*/}
        <YeeButton
          onClick={() => handleLike("resource", resource)}
          className={cn(
            "text-foreground cursor-pointer hover:text-foreground/80 rounded-full",
            isLiked && "text-red-500 hover:text-red-700",
          )}
          icon={<LikeIcon />}
        />
        <YeeButton
          onClick={(e) => {
            e.preventDefault();
            openMenu(e.clientX, e.clientY, "resource", resource);
          }}
          className="text-foreground cursor-pointer hover:text-foreground/80 rounded-full"
          icon={<MoreHorizontal24Regular />}
        />
      </div>
    </div>
  );
}
