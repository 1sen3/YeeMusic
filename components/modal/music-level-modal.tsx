import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SONG_QUALITY } from "@/lib/constants/song";
import { usePlayerStore } from "@/lib/store/playerStore";

export function MusicLevelModal() {
  const { musicLevel, currentSongMusicDetail, setMusicLevel } =
    usePlayerStore();

  function handleSetMusicLevel(level: string) {
    if (level in SONG_QUALITY) {
      setMusicLevel(level as keyof typeof SONG_QUALITY);
    }
  }

  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>
          <div className="border-0 bg-white/10 text-white/80 rounded-sm drop-shadow-md hover:bg-white/20 font-medium px-2 py-1 text-xs cursor-pointer">
            {SONG_QUALITY[musicLevel].desc}
          </div>
        </DialogTrigger>
        <DialogContent
          className="sm:max-w-sm rounded-3xl bg-black/40 text-white drop-shadow-md backdrop-blur-md border border-white/20"
          showCloseButton={false}
        >
          <div className="flex flex-col gap-2 px-4 pt-6 justify-start">
            <span className="text-lg">{SONG_QUALITY[musicLevel].desc}</span>
            <span className="text-lg text-white/60">24位/48 kHz ALAC</span>
          </div>

          <DialogFooter className="px-4 bg-transparent border-t-0 flex items-center justify-between! gap-4">
            <Button className="flex-1 h-10 py-2 rounded-full bg-white/20 text-white hover:bg-white/40 cursor-pointer">
              音频质量设置
            </Button>
            <DialogClose asChild>
              <Button className="flex-1 h-10 py-2 rounded-full bg-white text-black hover:bg-white/80 cursor-pointer">
                好
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
