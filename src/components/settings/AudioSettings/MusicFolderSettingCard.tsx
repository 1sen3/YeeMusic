import {
  Dismiss24Regular,
  Folder24Regular,
  FolderAdd24Regular,
} from "@fluentui/react-icons";
import SettingsExpandar, { SettingsExpandarDetail } from "../SettingsExpandar";
import { useLocalMusicStore } from "@/lib/store/localMusicStore/localMusicStore";
import { Button } from "@/components/ui/button";
import { open } from "@tauri-apps/plugin-dialog";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "@/components/yee-dialog";
import { useState } from "react";

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
      icon={<Folder24Regular />}
      trailing={
        <Button
          className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0 items-center"
          onClick={(e) => {
            e.stopPropagation();
            handleAddDir();
          }}
        >
          <FolderAdd24Regular /> 添加文件夹
        </Button>
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

                <YeeDialog
                  title="删除音乐库路径"
                  showTitle={true}
                  open={showRemove}
                  onOpenChange={(val) => {
                    setShowRemove(val);
                  }}
                  asForm
                  contentClassName="sm:max-w-2xl"
                  footer={
                    <div className="w-full flex gap-4">
                      <YeeDialogPrimaryButton>
                        删除文件夹
                      </YeeDialogPrimaryButton>
                      <YeeDialogCloseButton>取消</YeeDialogCloseButton>
                    </div>
                  }
                  trigger={
                    <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0 items-center">
                      <Dismiss24Regular />
                    </Button>
                  }
                >
                  如果将此文件夹从音乐库中移除，则该文件夹不会再出现在音乐中，但不会被删除。
                </YeeDialog>
              </div>
            </div>
          </SettingsExpandarDetail>
        ))}
      </div>
    </SettingsExpandar>
  );
}
