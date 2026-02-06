import { logout } from "@/lib/services/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useUserStore } from "@/lib/store/userStore";
import { toast } from "sonner";

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>退出登录</AlertDialogTitle>
          <AlertDialogDescription>确定要退出登录吗？</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>确定</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
