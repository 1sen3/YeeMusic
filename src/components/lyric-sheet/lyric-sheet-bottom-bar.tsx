import { sfCharacterPhonetic, sfTranslate } from "@bradleyhodges/sfsymbols";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAudioOutputDevices } from "@/hooks/use-audio-output-devices";
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
  hasTransLyric: boolean;
  hasRomaLyric: boolean;
  showTrans: boolean;
  showRoma: boolean;
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

export function LyricSheetBottomBar({
  isLyricOpen,
  hasTransLyric,
  hasRomaLyric,
  showTrans,
  showRoma,
  onShowTransChangeAction,
  onShowRomaChangeAction,
}: LyricSheetBottomBarProps) {
  return (
    <div className="grid h-16 w-full shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end px-6 pb-6 z-10000">
      <div className="justify-self-start">
        <DeviceControl />
      </div>

      <div />

      <LyricDisplayControls
        isVisible={isLyricOpen}
        hasTransLyric={hasTransLyric}
        hasRomaLyric={hasRomaLyric}
        showTrans={showTrans}
        showRoma={showRoma}
        onShowTransChangeAction={onShowTransChangeAction}
        onShowRomaChangeAction={onShowRomaChangeAction}
      />
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
    <div
      className={cn(
        "flex h-12 items-center gap-2 justify-self-end rounded-full p-1 backdrop-blur-xl",
        !shouldShowControls && "pointer-events-none invisible",
      )}
    >
      {hasTransLyric && shouldShowControls && (
        <Tooltip>
          <TooltipTrigger>
            <YeeButton
              variant="ghost"
              aria-pressed={showTrans}
              icon={
                <SFIcon icon={sfTranslate} className="size-5 drop-shadow-md" />
              }
              className={cn(
                "text-white/40 size-10 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white mix-blend-overlay",
                showTrans && "text-white/80",
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
              icon={
                <SFIcon
                  icon={sfCharacterPhonetic}
                  className="size-5 drop-shadow-md"
                />
              }
              className={cn(
                "text-white/40 size-10 rounded-full transition-all duration-300 ease-in-out hover:bg-white/10 hover:text-white mix-blend-overlay",
                showRoma && "text-white/80",
              )}
              onClick={toggleRoma}
            />
          </TooltipTrigger>
          <TooltipContent sideOffset={10}>罗马音</TooltipContent>
        </Tooltip>
      )}
    </div>
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
            "flex h-10 items-center rounded-full text-white/60 transition-colors duration-200 hover:bg-white/[0.14] hover:text-white",
            lyricSheetOutputDeviceLabelVisible
              ? "max-w-72 gap-3 px-4"
              : "w-10 justify-center",
          )}
        >
          <SFIcon className="size-4 shrink-0" icon={selectedDevice.icon} />
          {lyricSheetOutputDeviceLabelVisible && (
            <span className="truncate text-xs font-semibold mix-blend-plus-lighter">
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
