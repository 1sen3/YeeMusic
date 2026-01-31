import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Spinner } from "./ui/spinner";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Skeleton } from "./ui/skeleton";
import Image from "next/image";
import { useUserStore } from "@/lib/store/userStore";

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

  const [qrKey, setQrKey] = useState("");
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

      toast("验证码发送成功");

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
        toast("登录成功", { position: "top-right" });
        setUser(res.profile);
        onOpenChange?.(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogin(false);
    }
  }

  async function setupQrCode() {
    try {
      // 获取 key
      const keyRes = await getQrKey();
      const key = keyRes.data.unikey;
      setQrKey(key);

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
          toast("登录成功", { position: "top-center" });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>登录</DialogTitle>
            <DialogDescription>登录您的网易云音乐账号</DialogDescription>
          </DialogHeader>

          <Tabs
            className="w-auto items-center mt-2"
            onValueChange={(v) => {
              if (v === "qrcode") {
                setupQrCode();
              } else {
                if (qrTimerRef.current) clearInterval(qrTimerRef.current);
              }
            }}
          >
            <TabsList>
              <TabsTrigger value="cellphone">验证码登录</TabsTrigger>
              <TabsTrigger value="qrcode">扫码登录</TabsTrigger>
            </TabsList>
            <TabsContent value="cellphone">
              <div className="grid gap-4 px-4 py-4">
                <div className="grid gap-3">
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    name="name"
                    placeholder="请输入手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="captcha">验证码</Label>

                  <div className="flex justify-center gap-2">
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
                    />
                    <Button
                      className={
                        captchaPassed
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-black"
                      }
                      disabled={isLoad || captchaPassed}
                      onClick={handleGetCaptcha}
                    >
                      {isLoad ? <Spinner /> : ""}
                      {captchaPassed
                        ? "已通过"
                        : count > 0
                          ? `${count} 秒后重试`
                          : "获取验证码"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qrcode">
              <div className="flex flex-col items-center my-2 gap-6">
                {qrCodeImg ? (
                  <Image
                    src={qrCodeImg}
                    width={144}
                    height={144}
                    className={`rounded - sm ${qrStatus === 800 ? "opacity-20" : ""}`}
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

          <DialogFooter className="sm:justify-center gap-2">
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!captchaPassed}
              onClick={handleLogin}
            >
              {isLogin ? <Spinner /> : ""}登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
