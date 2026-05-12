import { logout } from "@/lib/services/auth";
import { useUserStore } from "@/lib/store/userStore/userStore";
import { toast } from "sonner";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "../yee-dialog";

export function LogoutForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const storeLogout = useUserStore((state) => state.logout);

  async function handleLogout() {
    try {
      await logout();
      storeLogout();
      onOpenChange?.(false);
      toast("退出登录成功", { position: "top-right" });
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <YeeDialog
      open={open}
      onOpenChange={onOpenChange}
      title="退出登录"
      showTitle={true}
      footer={
        <div className="w-full flex gap-4">
          <YeeDialogCloseButton>取消</YeeDialogCloseButton>
          <YeeDialogPrimaryButton
            onClick={handleLogout}
            className="bg-destructive hover:bg-destructive/80"
          >
            确定
          </YeeDialogPrimaryButton>
        </div>
      }
    >
      <span>确定要退出登录吗？</span>
    </YeeDialog>
  );
}
