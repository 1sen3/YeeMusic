import { useState } from "react";
import { Input } from "../ui/input";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "../yee-dialog";
import { Switch } from "../ui/switch";
import { createPlaylist } from "@/lib/services/playlist";
import { toast } from "sonner";
import { Spinner } from "../ui/spinner";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { getUserPlaylists } from "@/lib/services/user";

export function PlaylistAddForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);

  const { user, setPlaylistList } = useUserStore((s) => s);

  const leftNameLength = 40 - name.length;

  const canCreate = name.length > 0 && leftNameLength >= 0;

  async function handleAddPlaylist() {
    try {
      setCreating(true);
      const res = await createPlaylist(name, isPrivate);
      if (!res) {
        toast.error("创建歌单失败", { position: "top-center" });
      }

      if (user) {
        const getUserPlaylistRes = await getUserPlaylists(user.userId);
        setPlaylistList(getUserPlaylistRes.playlist);
      }
      toast.success("创建歌单成功", { position: "top-center" });
    } catch (error) {
      console.error("创建歌单失败", error);
      toast.error("创建歌单失败", { position: "top-center" });
    } finally {
      onOpenChange(false);
      setCreating(false);
    }
  }

  return (
    <YeeDialog
      title="新建歌单"
      asForm
      showTitle={false}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        <div className="w-full flex gap-4">
          <YeeDialogCloseButton
            variant="light"
            onClick={() => onOpenChange(false)}
          >
            取消
          </YeeDialogCloseButton>
          <YeeDialogPrimaryButton
            variant="light"
            disabled={!canCreate || creating}
            onClick={handleAddPlaylist}
          >
            <span className="flex gap-2 items-center">
              {creating && <Spinner />}创建
            </span>
          </YeeDialogPrimaryButton>
        </div>
      }
    >
      <div className="flex flex-col gap-8 px-6 pt-6">
        <span className="text-md font-semibold text-center">新建歌单</span>

        <div className="relative">
          <Input
            placeholder="歌单名称"
            className="text-foreground/80 bg-card pr-8"
            value={name}
            onChange={(e) => {
              if (e.target.value.length > 40) {
                return;
              }
              setName(e.target.value);
            }}
          />
          <span className="text-xs text-foreground/60 absolute right-4 bottom-1/2 translate-y-1/2">
            {leftNameLength}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm">设为隐私歌单</span>
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
        </div>
      </div>
    </YeeDialog>
  );
}
