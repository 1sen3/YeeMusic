import {
  sfAirplayAudio,
  sfCharacterPhonetic,
  sfTranslate,
} from "@bradleyhodges/sfsymbols";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { type AudioDeviceInfo, corePlayer } from "@/lib/player/corePlayer";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { YeeButton } from "../yee-button";

const DEFAULT_OUTPUT_DEVICE: AudioDeviceInfo = {
  id: "default",
  name: "系统默认",
  isDefault: true,
};

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
    <div className="grid h-16 w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center px-6 pb-6 z-10000">
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
  if (!isVisible || (!hasTransLyric && !hasRomaLyric)) return <div />;

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

  return (
    <div className="flex items-center gap-2 justify-self-end rounded-full p-1 backdrop-blur-xl">
      {hasTransLyric && (
        <YeeButton
          variant="ghost"
          aria-pressed={showTrans}
          icon={<SFIcon icon={sfTranslate} className="size-5 drop-shadow-md" />}
          className={cn(
            "size-10 rounded-full text-white/70 mix-blend-plus-lighter hover:bg-white/10 hover:text-white",
            showTrans &&
              "bg-white/40 text-black/70 hover:bg-white/70 hover:text-black/70",
          )}
          onClick={toggleTrans}
        />
      )}

      {hasRomaLyric && (
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
            "size-10 rounded-full text-white/70 mix-blend-plus-lighter hover:bg-white/10 hover:text-white",
            showRoma &&
              "bg-white/40 text-black/70 hover:bg-white/70 hover:text-black/70",
          )}
          onClick={toggleRoma}
        />
      )}
    </div>
  );
}

function DeviceControl() {
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<AudioDeviceInfo[]>([]);
  const [pendingDeviceId, setPendingDeviceId] = useState<string | null>(null);
  const audio = useSettingStore((s) => s.audio);
  const updateAudioEngine = useSettingStore((s) => s.updateAudioEngine);

  const loadDevices = useCallback(async () => {
    try {
      setDevices(await corePlayer.listOutputDevices());
    } catch (error) {
      console.error("[LyricSheetBottomBar] list output devices failed:", error);
      toast.error("无法读取输出设备");
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  const outputDevices = useMemo(() => {
    const next = new Map<string, AudioDeviceInfo>();
    next.set(DEFAULT_OUTPUT_DEVICE.id, DEFAULT_OUTPUT_DEVICE);
    devices.forEach((device) => next.set(device.id, device));
    return Array.from(next.values());
  }, [devices]);

  const selectedDeviceValue = audio.outputDeviceId ?? DEFAULT_OUTPUT_DEVICE.id;
  const selectedDevice = outputDevices.find(
    (device) => device.id === selectedDeviceValue,
  );
  const selectedDeviceLabel =
    selectedDevice?.name ?? audio.outputDeviceId ?? DEFAULT_OUTPUT_DEVICE.name;
  const isUpdatingDevice = pendingDeviceId !== null;

  async function handleDeviceChange(value: string) {
    if (value === selectedDeviceValue || isUpdatingDevice) return;

    setPendingDeviceId(value);
    try {
      await updateAudioEngine({
        outputDeviceId: value === DEFAULT_OUTPUT_DEVICE.id ? null : value,
      });
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
          className="flex h-10 max-w-72 items-center gap-3 rounded-full px-4 text-white/60 transition-colors duration-200 hover:bg-white/[0.14] hover:text-white"
        >
          <SFIcon className="size-4 shrink-0" icon={sfAirplayAudio} />
          <span className="truncate text-xs font-semibold mix-blend-plus-lighter">
            {selectedDeviceLabel}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-72 bg-card/60"
      >
        <DropdownMenuRadioGroup
          value={selectedDeviceValue}
          onValueChange={(value) => {
            void handleDeviceChange(value);
          }}
        >
          {outputDevices.map((device) => (
            <DropdownMenuRadioItem
              key={device.id}
              value={device.id}
              disabled={isUpdatingDevice}
            >
              <span className="truncate">{device.name}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
