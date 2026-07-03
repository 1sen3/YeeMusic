import {
  Dismiss24Regular,
  Folder20Regular,
  FolderAdd24Regular,
} from "@fluentui/react-icons";
import SettingsExpandar, { SettingsExpandarDetail } from "../SettingsExpandar";
import { useLocalMusicStore } from "@/lib/store/localMusicStore/localMusicStore";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Dialog,
  DialogAction,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { YeeButton } from "@/components/yee-button";

export function MusicFolderSettingCard() {
  const scanDirs = useLocalMusicStore((s) => s.scanDirs);
  const addScanDir = useLocalMusicStore((s) => s.addScanDir);
  const [showRemove, setShowRemove] = useState(false);

  async function handleAddDir() {
    const selected = await open({
      directory: true,
      title: "选择音乐文件夹",
    });
    if (selected) {
      await addScanDir(selected as string);
    }
  }

  return (
    <SettingsExpandar
      title="音乐库"
      subtitle="添加本地音乐库路径"
      icon={<Folder20Regular />}
      trailing={
        <YeeButton
          variant="default"
          onClick={(e) => {
            e.stopPropagation();
            handleAddDir();
          }}
        >
          <FolderAdd24Regular /> 添加文件夹
        </YeeButton>
      }
    >
      <div className="flex flex-col gap-0">
        {scanDirs.map((d) => (
          <SettingsExpandarDetail>
            <div className="w-full flex justify-between items-center">
              <div className="flex w-full justify-between items-center">
                <span className="text-sm text-muted-foreground truncate max-w-xs">
                  {d}
                </span>

                <Dialog
                  open={showRemove}
                  onOpenChange={(val) => {
                    setShowRemove(val);
                  }}
                >
                  <DialogTrigger asChild>
                    <YeeButton variant="default">
                      <Dismiss24Regular />
                    </YeeButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogTitle>删除音乐库路径</DialogTitle>
                    <DialogBody>
                      如果将此文件夹从音乐库中移除，则该文件夹中的音乐不会出现在
                      Yee Music 中，但不会被删除。
                    </DialogBody>
                    <DialogFooter>
                      <DialogAction>删除文件夹</DialogAction>
                      <DialogCancel>取消</DialogCancel>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </SettingsExpandarDetail>
        ))}
      </div>
    </SettingsExpandar>
  );
}
