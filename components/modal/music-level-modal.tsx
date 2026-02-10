import { SONG_QUALITY } from "@/lib/constants/song";
import { usePlayerStore } from "@/lib/store/playerStore";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "../yee-dialog";

export function MusicLevelModal() {
  const { musicLevel, currentSongMusicDetail, setMusicLevel } =
    usePlayerStore();

  function handleSetMusicLevel(level: string) {
    if (level in SONG_QUALITY) {
      setMusicLevel(level as keyof typeof SONG_QUALITY);
    }
  }

  return (
    <YeeDialog
      variant="dark"
      title="音频质量"
      asForm={false}
      trigger={
        <div className="border-0 bg-white/10 text-white/80 rounded-sm drop-shadow-md hover:bg-white/20 font-medium px-2 py-1 text-xs cursor-pointer">
          {SONG_QUALITY[musicLevel].desc}
        </div>
      }
      footer={
        <div className="w-full flex gap-2">
          <YeeDialogPrimaryButton
            onClick={() => handleSetMusicLevel(musicLevel)}
            variant="dark"
          >
            音频质量设置
          </YeeDialogPrimaryButton>
          <YeeDialogCloseButton variant="dark">好</YeeDialogCloseButton>
        </div>
      }
    >
      <div className="flex flex-col gap-2 px-4 pt-6 justify-start">
        <span className="text-lg">{SONG_QUALITY[musicLevel].desc}</span>
        <span className="text-lg text-white/60">24位/48 kHz ALAC</span>
      </div>
    </YeeDialog>
  );
}
