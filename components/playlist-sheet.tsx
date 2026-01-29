import { NavigationPlay20Regular } from "@fluentui/react-icons";
import { MyTooltip } from "./my-tooltip";
import {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Sheet,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { usePlayerStore } from "@/lib/store/playerStore";
import { PlaylistSongPreview } from "./playlist-song-preview";
import { Separator } from "./ui/separator";
import { useUserStore } from "@/lib/store/userStore";

export function PlaylistSheet() {
  const { playlist, currentSong } = usePlayerStore();
  const { likeListSet } = useUserStore();

  return (
    <Sheet>
      <MyTooltip tooltip="播放列表">
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-12 cursor-pointer"
          >
            <NavigationPlay20Regular className="size-6" />
          </Button>
        </SheetTrigger>
      </MyTooltip>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>播放列表</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          {playlist.map((song, idx) => (
            <>
              <PlaylistSongPreview
                song={song}
                key={idx}
                isPlaying={song.id === currentSong?.id}
                isLike={likeListSet.has(Number(song.id))}
              />
              {idx !== playlist.length - 1 && <Separator />}
            </>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
