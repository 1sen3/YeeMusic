import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";
import {
  checkQrStatus,
  createQrImg,
  getQrKey,
  loginByPhone,
  loginStatus,
  sentCaptcha,
  verifyCaptcha,
} from "@/lib/services/auth";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Skeleton } from "../ui/skeleton";
import { useUserStore } from "@/lib/store/userStore/userStore";
import {
  YeeDialog,
  YeeDialogCloseButton,
  YeeDialogPrimaryButton,
} from "../yee-dialog";
import { cn } from "@/lib/utils";
import { Checkmark24Filled } from "@fluentui/react-icons";
import { useSettingStore } from "@/lib/store/settingStore/settingStore";

export function LoginForm({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [count, setCount] = useState(0);
  const [isLoad, setIsLoad] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [phone, setPhone] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [error, setError] = useState("");

  // const [qrKey, setQrKey] = useState("");
  const [qrCodeImg, setQrCodeImg] = useState("");
  const [qrStatus, setQrStatus] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null);

  const setUser = useUserStore((state) => state.setUser);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (qrTimerRef.current) clearInterval(qrTimerRef.current);
    };
  }, []);

  async function handleGetCaptcha() {
    if (!phone || phone.length !== 11) return;
    if (count > 0) return; // 倒计时中，阻止获取验证码

    try {
      setIsLoad(true);
      await sentCaptcha(phone);
      // 发送成功，开始倒计时
      setCount(60);
      timerRef.current = setInterval(() => {
        setCount((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoad(false);
    }
  }

  async function handleVerifyCaptcha() {
    if (!phone || !captcha || captcha.length !== 4) return;

    try {
      setIsLoad(true);
      const res = await verifyCaptcha(phone, captcha);
      if (res?.code === 200) {
        setCaptchaPassed(true);
      }
    } catch (err) {
      console.error(err);
      setCaptchaPassed(false);
    } finally {
      setIsLoad(false);
    }
  }

  async function handleLogin() {
    try {
      setIsLogin(true);
      const res = await loginByPhone(phone, captcha);
      if (res.code === 200) {
        toast.success("登录成功", { position: "top-right" });
        setUser(res.profile);
        onOpenChange?.(false);
      }
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("登录失败，请重试");
      }
    } finally {
      setIsLogin(false);
    }
  }

  async function setupQrCode() {
    try {
      // 获取 key
      const keyRes = await getQrKey();
      const key = keyRes.data.unikey;
      // setQrKey(key);

      // 生成二维码
      const imgRes = await createQrImg(key);
      setQrCodeImg(imgRes.data.qrimg);
      setQrStatus(801);

      // 开始轮询
      startCheckQrStatus(key);
    } catch (err) {
      console.error("二维码初始化失败", err);
    }
  }

  async function startCheckQrStatus(key: string) {
    if (qrTimerRef.current) clearInterval(qrTimerRef.current);

    qrTimerRef.current = setInterval(async () => {
      try {
        const res = await checkQrStatus(key);
        setQrStatus(res.code);

        if (res.code === 800) {
          clearInterval(qrTimerRef.current!);
        } else if (res.code === 803) {
          clearInterval(qrTimerRef.current!);
          toast.success("登录成功", { position: "top-center" });

          const statusRes = await loginStatus();
          if (statusRes.code === 200 && statusRes.profile)
            setUser(statusRes.profile);

          onOpenChange?.(false);
        }
      } catch (err) {
        console.log("轮询错误", err);
      }
    }, 3000);
  }

  const theme = useSettingStore((s) => s.appearance.theme);

  return (
    <YeeDialog
      asForm={true}
      open={open}
      onOpenChange={onOpenChange}
      title="登录"
      footer={
        <div className="w-full flex gap-2">
          <YeeDialogCloseButton variant={theme === "dark" ? "dark" : "light"}>
            取消
          </YeeDialogCloseButton>
          <YeeDialogPrimaryButton
            type="submit"
            disabled={!captchaPassed || error !== ""}
            onClick={handleLogin}
          >
            {isLogin ? <Spinner /> : ""}登录
          </YeeDialogPrimaryButton>
        </div>
      }
    >
      <div className="p-4 w-full min-w-0">
        <Tabs
          className="w-full "
          onValueChange={(v) => {
            if (v === "qrcode") {
              setupQrCode();
            } else {
              if (qrTimerRef.current) clearInterval(qrTimerRef.current);
            }
          }}
        >
          <TabsList className="mx-auto rounded-full">
            <TabsTrigger value="cellphone">验证码登录</TabsTrigger>
            <TabsTrigger value="qrcode">扫码登录</TabsTrigger>
          </TabsList>
          <TabsContent value="cellphone">
            <div className="w-full flex flex-col gap-10 pt-6">
              <div className="w-full flex flex-col gap-4 relative">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  name="name"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setCaptchaPassed(false);
                    if (error) setError("");
                  }}
                  onBlur={() => {
                    if (!phone) return;
                    if (!/^1\d{10}$/.test(phone)) {
                      setError("手机号格式不正确");
                    }
                  }}
                  className={cn(
                    "bg-card w-full",
                    error && "border-destructive border-2",
                  )}
                  containerClassName="rounded-sm"
                  autoComplete="off"
                />
                <span className="text-destructive text-xs -mt-1 absolute -bottom-6.5">
                  {error}
                </span>
              </div>
              <div className="w-full flex flex-col gap-4">
                <Label htmlFor="captcha">验证码</Label>

                <div className="w-full flex gap-2">
                  <Input
                    id="captcha"
                    name="captcha"
                    placeholder="请输入验证码"
                    value={captcha}
                    onChange={(e) => {
                      setCaptcha(e.target.value);
                      setCaptchaPassed(false);
                    }}
                    onBlur={handleVerifyCaptcha}
                    className="bg-card"
                    containerClassName="rounded-sm flex-1"
                  />
                  <motion.button
                    className={cn(
                      captchaPassed ? "bg-green-600!" : "bg-card!",
                      "cursor-pointer rounded-md border-card border shrink-0 px-4 whitespace-nowrap overflow-hidden flex items-center justify-center text-foreground",
                    )}
                    disabled={isLoad || captchaPassed}
                    onClick={handleGetCaptcha}
                    layout
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <motion.div
                      layout="position"
                      className="flex items-center justify-center gap-1"
                    >
                      {isLoad ? <Spinner /> : ""}
                      {captchaPassed ? (
                        <Checkmark24Filled className="size-4" />
                      ) : count > 0 ? (
                        `${count} 秒后重试`
                      ) : (
                        "获取验证码"
                      )}
                    </motion.div>
                  </motion.button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qrcode">
            <div className="flex flex-col items-center gap-6 pt-6">
              {qrCodeImg ? (
                <img
                  src={qrCodeImg}
                  width={144}
                  height={144}
                  className={cn(
                    "rounded-md drop-shadow-md",
                    qrStatus === 800 ? "opacity-20" : "",
                  )}
                  alt="Login qr code"
                />
              ) : (
                <Skeleton className="h-36 w-36" />
              )}

              <p>
                使用<span className="font-bold">网易云音乐 APP</span> 扫码登录
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </YeeDialog>
  );
}
