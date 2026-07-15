import SFIcon from "@bradleyhodges/sfsymbols-react";
import { type ReactNode, useId, useState } from "react";
import { toast } from "sonner";
import { useAudioOutputDevices } from "@/hooks/use-audio-output-devices";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { YeeButton } from "../yee-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface LyricSheetBottomBarProps {
  isLyricOpen: boolean;
  isPlaylistOpen: boolean;
  hasTransLyric: boolean;
  hasRomaLyric: boolean;
  showTrans: boolean;
  showRoma: boolean;
  onLyricOpenChangeAction: (value: boolean) => void;
  onPlaylistOpenChangeAction: (value: boolean) => void;
  onShowTransChangeAction: (value: boolean) => void;
  onShowRomaChangeAction: (value: boolean) => void;
}

interface LyricDisplayControlsProps {
  isVisible: boolean;
  hasTransLyric: boolean;
  hasRomaLyric: boolean;
  showTrans: boolean;
  showRoma: boolean;
  onShowTransChangeAction: (value: boolean) => void;
  onShowRomaChangeAction: (value: boolean) => void;
}

const lyricBubbleFillPath =
  "M21.523 5.781v7.48c0 2.862-1.562 4.464-4.472 4.464h-6.602l-3.525 3.222c-.46.43-.742.625-1.123.625-.557 0-.87-.4-.87-1.006v-2.841h-.458C1.563 17.725 0 16.133 0 13.262v-7.48C0 2.91 1.563 1.308 4.473 1.308H17.05c2.91 0 4.472 1.61 4.472 4.472M5.898 8.457c0 1.143.713 2.031 1.856 2.031.42 0 .84-.068 1.103-.4h.079a2.86 2.86 0 0 1-1.797 1.543c-.381.098-.489.254-.489.498 0 .254.215.469.498.469 1.016 0 3.057-1.211 3.057-3.77 0-1.367-.879-2.412-2.187-2.412-1.211 0-2.12.84-2.12 2.041m5.44 0c0 1.143.713 2.031 1.846 2.031.43 0 .85-.068 1.113-.4h.078a2.86 2.86 0 0 1-1.807 1.543c-.361.098-.478.254-.478.498 0 .254.215.469.498.469 1.016 0 3.057-1.211 3.057-3.77 0-1.367-.89-2.412-2.198-2.412-1.21 0-2.11.84-2.11 2.041";

const playlistBulletFillPath =
  "M5.54688 13.8281L18.877 13.8281C19.3164 13.8281 19.6777 13.4863 19.6777 13.0371C19.6777 12.5977 19.3164 12.2559 18.877 12.2559L5.54688 12.2559C5.09766 12.2559 4.75586 12.5977 4.75586 13.0371C4.75586 13.4863 5.09766 13.8281 5.54688 13.8281Z M1.23047 14.2676C1.91406 14.2676 2.46094 13.7207 2.46094 13.0371C2.46094 12.3633 1.91406 11.8164 1.23047 11.8164C0.546875 11.8164 0 12.3633 0 13.0371C0 13.7207 0.546875 14.2676 1.23047 14.2676Z M5.54688 7.91992L18.877 7.91992C19.3164 7.91992 19.6777 7.57812 19.6777 7.13867C19.6777 6.69922 19.3164 6.34766 18.877 6.34766L5.54688 6.34766C5.09766 6.34766 4.75586 6.69922 4.75586 7.13867C4.75586 7.57812 5.09766 7.91992 5.54688 7.91992Z M1.23047 8.36914C1.91406 8.36914 2.46094 7.82227 2.46094 7.13867C2.46094 6.45508 1.91406 5.9082 1.23047 5.9082C0.546875 5.9082 0 6.45508 0 7.13867C0 7.82227 0.546875 8.36914 1.23047 8.36914Z M5.54688 2.02148L18.877 2.02148C19.3164 2.02148 19.6777 1.67969 19.6777 1.23047C19.6777 0.791016 19.3164 0.449219 18.877 0.449219L5.54688 0.449219C5.09766 0.449219 4.75586 0.791016 4.75586 1.23047C4.75586 1.67969 5.09766 2.02148 5.54688 2.02148Z M1.23047 2.46094C1.91406 2.46094 2.46094 1.91406 2.46094 1.23047C2.46094 0.556641 1.91406 0 1.23047 0C0.546875 0 0 0.556641 0 1.23047C0 1.91406 0.546875 2.46094 1.23047 2.46094Z";

const translateFillPath =
  "M17.6367 4.04297L17.6367 4.93164L17.1777 4.93164C16.7796 4.93164 16.4069 4.9673 16.0645 5.04126L16.0645 4.0918C16.0645 2.37305 15.0977 1.47461 13.4668 1.47461L4.16992 1.47461C2.53906 1.47461 1.57227 2.37305 1.57227 4.0918L1.57227 9.76562C1.57227 11.4941 2.54883 12.3828 4.16992 12.3828L5.19531 12.3828C5.61523 12.3828 5.94727 12.627 5.94727 13.1738L5.94727 15.6445L9.0918 12.832C9.47266 12.4902 9.7168 12.3828 10.2441 12.3828L13.0957 12.3828L13.0957 13.8477L10.1855 13.8477L6.92383 16.6406C6.33789 17.1484 6.01562 17.4121 5.53711 17.4121C4.86328 17.4121 4.48242 16.9336 4.48242 16.1914L4.48242 13.8477L4.08203 13.8477C1.63086 13.8477 0 12.373 0 9.81445L0 4.04297C0 1.48438 1.63086 0 4.08203 0L13.5547 0C16.0059 0 17.6367 1.48438 17.6367 4.04297Z M9.85352 3.36914L12.2656 9.84375C12.4609 10.3809 12.1777 10.8789 11.6016 10.8789C11.2305 10.8789 11.0059 10.6738 10.8594 10.2637L10.2637 8.54492L7.39258 8.54492L6.79688 10.2637C6.66016 10.6738 6.42578 10.8789 6.05469 10.8789C5.48828 10.8789 5.19531 10.3809 5.39062 9.84375L7.79297 3.36914C7.96875 2.89062 8.33008 2.62695 8.81836 2.62695C9.32617 2.62695 9.67773 2.89062 9.85352 3.36914ZM7.79297 7.34375L9.85352 7.34375L8.82324 4.33879Z M30.7324 8.97461L30.7324 14.7461C30.7324 17.2949 29.1016 18.7793 26.6504 18.7793L26.2402 18.7793L26.2402 21.123C26.2402 21.8652 25.8691 22.3438 25.1953 22.3438C24.7168 22.3438 24.3945 22.0801 23.8086 21.5723L20.5371 18.7793L17.1777 18.7793C14.6094 18.7793 13.0957 17.3047 13.0957 14.7461L13.0957 8.97461C13.0957 6.41602 14.6094 4.93164 17.1777 4.93164L26.6504 4.93164C29.1016 4.93164 30.7324 6.41602 30.7324 8.97461ZM18.7891 9.60938C18.3887 9.60938 18.0957 9.88281 18.0957 10.2539C18.0957 10.6348 18.3887 10.918 18.7891 10.918L19.5312 10.918C19.7949 11.875 20.293 12.7832 20.9766 13.5449C20.3125 13.9844 19.541 14.3066 18.6523 14.5215C18.2715 14.6094 18.0469 14.9707 18.125 15.3613C18.2324 15.752 18.623 15.9277 19.043 15.8105C20.1074 15.5762 21.1035 15.127 21.9922 14.4727C22.8418 15.1172 23.8379 15.5664 24.8242 15.8008C25.3027 15.918 25.7031 15.7715 25.8105 15.3613C25.918 14.9414 25.7227 14.6094 25.3027 14.5215C24.4141 14.3164 23.6523 13.9941 22.9688 13.5449C23.6621 12.8027 24.1504 11.9043 24.4141 10.918L25.166 10.918C25.5664 10.918 25.8594 10.6348 25.8594 10.2539C25.8594 9.88281 25.5664 9.60938 25.166 9.60938ZM21.9922 12.7148C21.5137 12.1875 21.1328 11.5723 20.9082 10.918L23.0469 10.918C22.8223 11.5625 22.4609 12.1777 21.9922 12.7148ZM21.0156 7.02148C20.6836 7.17773 20.5371 7.57812 20.7129 7.93945L21.1816 8.92578C21.3379 9.27734 21.7383 9.41406 22.0801 9.26758C22.4414 9.08203 22.5879 8.69141 22.4121 8.33984L21.9336 7.36328C21.7578 6.99219 21.3672 6.82617 21.0156 7.02148Z";

const romaFillPath =
  "M4.56 13.272c2.227 0 3.975-1.124 4.922-2.989h.098c.83 1.875 2.549 2.989 4.844 2.989 2.392 0 4.219-1.026 4.99-2.862.078-.195.137-.4.137-.556 0-.479-.322-.791-.81-.791-.294 0-.509.126-.684.39-.889 1.553-2.002 2.237-3.701 2.237-2.442 0-4.004-1.807-4.004-4.493V7.07h8.222c.654 0 1.045-.4 1.045-1.084 0-3.515-2.148-5.976-5.283-5.976-2.12 0-3.691 1.035-4.522 2.773h-.078C9.238 1.045 7.55.01 5.332.01 3.222.01 1.396.996.722 2.5a1.86 1.86 0 0 0-.234.85c0 .488.332.81.801.81.361 0 .606-.146.762-.469.664-1.455 1.738-2.08 3.31-2.08 1.905 0 3.184 1.211 3.184 2.96v1.074l-3.818.205C1.67 6.006 0 7.314 0 9.492c0 2.285 1.787 3.78 4.56 3.78m.06-1.563c-1.68 0-2.774-.937-2.774-2.246s1.084-2.07 3.076-2.188l3.623-.205v1.133c0 1.934-1.719 3.506-3.926 3.506m5.732-6.064c.146-2.393 1.67-4.053 3.847-4.053 2.149 0 3.516 1.62 3.555 4.053Z";

const panelMaskViewBoxSize = 40;
const panelMaskGlyphSize = 20;
const panelMaskGlyphOffset = (panelMaskViewBoxSize - panelMaskGlyphSize) / 2;

export function LyricSheetBottomBar({
  isLyricOpen,
  isPlaylistOpen,
  hasTransLyric,
  hasRomaLyric,
  showTrans,
  showRoma,
  onLyricOpenChangeAction,
  onPlaylistOpenChangeAction,
  onShowTransChangeAction,
  onShowRomaChangeAction,
}: LyricSheetBottomBarProps) {
  return (
    <div className="grid h-16 w-full shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end px-6 pb-6 z-10000">
      <div className="justify-self-start">
        <DeviceControl />
      </div>

      <div />

      <div className="flex h-10 items-center gap-2 justify-self-end rounded-full backdrop-blur-xl">
        <LyricDisplayControls
          isVisible={isLyricOpen}
          hasTransLyric={hasTransLyric}
          hasRomaLyric={hasRomaLyric}
          showTrans={showTrans}
          showRoma={showRoma}
          onShowTransChangeAction={onShowTransChangeAction}
          onShowRomaChangeAction={onShowRomaChangeAction}
        />
        <SheetPanelControls
          isLyricOpen={isLyricOpen}
          isPlaylistOpen={isPlaylistOpen}
          onLyricOpenChangeAction={onLyricOpenChangeAction}
          onPlaylistOpenChangeAction={onPlaylistOpenChangeAction}
        />
      </div>
    </div>
  );
}

function LyricDisplayControls({
  isVisible,
  hasTransLyric,
  hasRomaLyric,
  showTrans,
  showRoma,
  onShowTransChangeAction,
  onShowRomaChangeAction,
}: LyricDisplayControlsProps) {
  function toggleTrans() {
    const nextShowTrans = !showTrans;
    onShowTransChangeAction(nextShowTrans);
    if (nextShowTrans) onShowRomaChangeAction(false);
  }

  function toggleRoma() {
    const nextShowRoma = !showRoma;
    onShowRomaChangeAction(nextShowRoma);
    if (nextShowRoma) onShowTransChangeAction(false);
  }

  const shouldShowControls = isVisible && (hasTransLyric || hasRomaLyric);

  return (
    <>
      {shouldShowControls && (
        <div className="flex gap-2 yee-glass-surface rounded-full p-1 bg-white/15">
          {hasTransLyric && shouldShowControls && (
            <Tooltip>
              <TooltipTrigger>
                <YeeButton
                  variant="ghost"
                  aria-pressed={showTrans}
                  icon={<TranslatePanelIcon active={showTrans} />}
                  className={cn(
                    "relative size-10 rounded-full transition-all duration-300 ease-in-out mix-blend-overlay",
                    showTrans
                      ? "bg-transparent! text-white hover:bg-transparent! hover:text-white"
                      : "text-white hover:bg-transparent!",
                  )}
                  onClick={toggleTrans}
                />
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>翻译</TooltipContent>
            </Tooltip>
          )}

          {hasRomaLyric && shouldShowControls && (
            <Tooltip>
              <TooltipTrigger>
                <YeeButton
                  variant="ghost"
                  aria-pressed={showRoma}
                  icon={<RomaPanelIcon active={showRoma} />}
                  className={cn(
                    "relative size-10 rounded-full transition-all duration-300 ease-in-out mix-blend-overlay",
                    showRoma
                      ? "bg-transparent! text-white hover:bg-transparent! hover:text-white"
                      : "text-white hover:bg-transparent!",
                  )}
                  onClick={toggleRoma}
                />
              </TooltipTrigger>
              <TooltipContent sideOffset={10}>罗马音</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </>
  );
}

function SheetPanelControls({
  isLyricOpen,
  isPlaylistOpen,
  onLyricOpenChangeAction,
  onPlaylistOpenChangeAction,
}: {
  isLyricOpen: boolean;
  isPlaylistOpen: boolean;
  onLyricOpenChangeAction: (value: boolean) => void;
  onPlaylistOpenChangeAction: (value: boolean) => void;
}) {
  const isFmMode = usePlayerStore((s) => s.isFmMode);

  return (
    <div className="flex gap-2 yee-glass-surface rounded-full p-1 bg-white/15">
      <Tooltip>
        <TooltipTrigger>
          <YeeButton
            variant="ghost"
            aria-pressed={isLyricOpen}
            icon={<LyricPanelIcon active={isLyricOpen} />}
            onClick={() => {
              onLyricOpenChangeAction(!isLyricOpen);
              onPlaylistOpenChangeAction(false);
            }}
            className={cn(
              "relative size-10 rounded-full transition-all duration-300 ease-in-out mix-blend-overlay",
              isLyricOpen
                ? "bg-transparent! text-white hover:bg-transparent! hover:text-white"
                : "text-white hover:bg-transparent!",
            )}
          />
        </TooltipTrigger>
        <TooltipContent sideOffset={10}>歌词</TooltipContent>
      </Tooltip>

      {!isFmMode && (
        <Tooltip>
          <TooltipTrigger>
            <YeeButton
              variant="ghost"
              aria-pressed={isPlaylistOpen}
              icon={<PlaylistPanelIcon active={isPlaylistOpen} />}
              onClick={() => {
                onPlaylistOpenChangeAction(!isPlaylistOpen);
                onLyricOpenChangeAction(false);
              }}
              className={cn(
                "relative size-10 rounded-full transition-all duration-300 ease-in-out mix-blend-overlay",
                isPlaylistOpen
                  ? "bg-transparent! text-white hover:bg-transparent! hover:text-white"
                  : "text-white hover:bg-transparent!",
              )}
            />
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>播放列表</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

function MaskedActivePanelIcon({
  maskId,
  children,
  className,
}: {
  maskId: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={cn(
        "pointer-events-none absolute -inset-px size-[calc(100%+2px)] overflow-visible",
        className,
      )}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="white" />
          {children}
        </mask>
      </defs>
      <circle
        cx={panelMaskViewBoxSize / 2}
        cy={panelMaskViewBoxSize / 2}
        r={panelMaskViewBoxSize / 2}
        fill="white"
        fillOpacity="0.5"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

function LyricPanelIcon({ active }: { active: boolean }) {
  const reactId = useId();
  const maskId = `lyric-panel-icon-${reactId.replace(/:/g, "")}`;
  const glyphClassName = cn(
    "size-5 drop-shadow-md transition-opacity duration-200 ease-in-out",
    active ? "opacity-0" : "group-hover/button:opacity-0",
  );
  const maskedIcon = (
    <MaskedActivePanelIcon
      maskId={maskId}
      className={cn(
        "transition-opacity duration-200 ease-in-out",
        active ? "opacity-100" : "opacity-0 group-hover/button:opacity-100",
      )}
    >
      <svg
        x={panelMaskGlyphOffset}
        y={panelMaskGlyphOffset}
        width={panelMaskGlyphSize}
        height={panelMaskGlyphSize}
        viewBox="0 0 21.885 21.572"
      >
        <path d={lyricBubbleFillPath} fill="black" />
      </svg>
    </MaskedActivePanelIcon>
  );

  return (
    <>
      <LyricGlyph className={glyphClassName} />
      {maskedIcon}
    </>
  );
}

function PlaylistPanelIcon({ active }: { active: boolean }) {
  const reactId = useId();
  const maskId = `playlist-panel-icon-${reactId.replace(/:/g, "")}`;
  const glyphClassName = cn(
    "size-5 drop-shadow-md transition-opacity duration-200 ease-in-out",
    active ? "opacity-0" : "group-hover/button:opacity-0",
  );
  const maskedIcon = (
    <MaskedActivePanelIcon
      maskId={maskId}
      className={cn(
        "transition-opacity duration-200 ease-in-out",
        active ? "opacity-100" : "opacity-0 group-hover/button:opacity-100",
      )}
    >
      <svg
        x={panelMaskGlyphOffset}
        y={panelMaskGlyphOffset}
        width={panelMaskGlyphSize}
        height={panelMaskGlyphSize}
        viewBox="0 0 20.0391 14.2676"
      >
        <path d={playlistBulletFillPath} fill="black" />
      </svg>
    </MaskedActivePanelIcon>
  );

  return (
    <>
      <PlaylistGlyph className={glyphClassName} />
      {maskedIcon}
    </>
  );
}

function TranslatePanelIcon({ active }: { active: boolean }) {
  const reactId = useId();
  const maskId = `translate-panel-icon-${reactId.replace(/:/g, "")}`;
  const glyphClassName = cn(
    "size-5 drop-shadow-md transition-opacity duration-200 ease-in-out",
    active ? "opacity-0" : "group-hover/button:opacity-0",
  );
  const maskedIcon = (
    <MaskedActivePanelIcon
      maskId={maskId}
      className={cn(
        "transition-opacity duration-200 ease-in-out",
        active ? "opacity-100" : "opacity-0 group-hover/button:opacity-100",
      )}
    >
      <svg
        x={panelMaskGlyphOffset}
        y={panelMaskGlyphOffset}
        width={panelMaskGlyphSize}
        height={panelMaskGlyphSize}
        viewBox="0 0 31.0938 22.3535"
      >
        <path d={translateFillPath} fill="black" />
      </svg>
    </MaskedActivePanelIcon>
  );

  return (
    <>
      <TranslateGlyph className={glyphClassName} />
      {maskedIcon}
    </>
  );
}

function RomaPanelIcon({ active }: { active: boolean }) {
  const reactId = useId();
  const maskId = `roma-panel-icon-${reactId.replace(/:/g, "")}`;
  const glyphClassName = cn(
    "size-5 drop-shadow-md transition-opacity duration-200 ease-in-out",
    active ? "opacity-0" : "group-hover/button:opacity-0",
  );
  const maskedIcon = (
    <MaskedActivePanelIcon
      maskId={maskId}
      className={cn(
        "transition-opacity duration-200 ease-in-out",
        active ? "opacity-100" : "opacity-0 group-hover/button:opacity-100",
      )}
    >
      <svg
        x={panelMaskGlyphOffset}
        y={panelMaskGlyphOffset}
        width={panelMaskGlyphSize}
        height={panelMaskGlyphSize}
        viewBox="0 0 19.98 13.271"
      >
        <path d={romaFillPath} fill="black" />
      </svg>
    </MaskedActivePanelIcon>
  );

  return (
    <>
      <RomaGlyph className={glyphClassName} />
      {maskedIcon}
    </>
  );
}

function LyricGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 21.885 21.572"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={lyricBubbleFillPath} fill="currentColor" fillOpacity={0.85} />
    </svg>
  );
}

function PlaylistGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20.0391 14.2676"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={playlistBulletFillPath} fill="currentColor" fillOpacity={0.85} />
    </svg>
  );
}

function TranslateGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 31.0938 22.3535"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={translateFillPath} fill="currentColor" fillOpacity={0.85} />
    </svg>
  );
}

function RomaGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 19.98 13.271"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={romaFillPath} fill="currentColor" fillOpacity={0.85} />
    </svg>
  );
}

function DeviceControl() {
  const [open, setOpen] = useState(false);
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
  const {
    availableDevices,
    selectedDevice,
    selectedDeviceId,
    lyricSheetOutputDeviceLabelVisible,
    isRefreshing,
    hasLoadedDevices,
    selectOutputDevice,
  } = useAudioOutputDevices({
    onRefreshError: (error) => {
      console.error("[LyricSheetBottomBar] list output devices failed:", error);
      toast.error("无法读取输出设备");
    },
  });
  const isUpdatingDevice = pendingDeviceId !== null;
  const shouldShowUnavailable =
    hasLoadedDevices && !isRefreshing && !selectedDevice.isAvailable;

  async function handleDeviceChange(value: string) {
    if (value === selectedDeviceId || isUpdatingDevice) return;

    setPendingDeviceId(value);
    try {
      await selectOutputDevice(value);
    } catch (error) {
      console.error(
        "[LyricSheetBottomBar] update output device failed:",
        error,
      );
      toast.error("无法切换输出设备");
    } finally {
      setPendingDeviceId(null);
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={selectedDevice.displayName}
          className={cn(
            "flex h-10 items-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/40 hover:text-white yee-glass-surface p-1 bg-white/15",
            lyricSheetOutputDeviceLabelVisible
              ? "max-w-72 gap-3 px-4"
              : "w-10 justify-center",
          )}
        >
          <SFIcon className="size-4 shrink-0" icon={selectedDevice.icon} />
          {lyricSheetOutputDeviceLabelVisible && (
            <span className="truncate text-xs font-bold mix-blend-plus-lighter">
              {selectedDevice.displayName}
            </span>
          )}
          {lyricSheetOutputDeviceLabelVisible && shouldShowUnavailable && (
            <span className="shrink-0 text-[10px] font-medium opacity-70">
              不可用
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-72 bg-card/60"
      >
        <DropdownMenuRadioGroup
          value={selectedDeviceId}
          onValueChange={(value) => {
            void handleDeviceChange(value);
          }}
        >
          {availableDevices.map((device) => (
            <DropdownMenuRadioItem
              key={device.id}
              value={device.id}
              disabled={isUpdatingDevice}
            >
              <SFIcon icon={device.icon} className="size-4 shrink-0" />
              <span className="truncate">{device.displayName}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
