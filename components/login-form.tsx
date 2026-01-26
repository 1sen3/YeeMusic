import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Spinner } from "./ui/spinner";
import { loginByPhone, sentCaptcha, verifyCaptcha } from "@/lib/services/auth";
import { toast } from "sonner";

export function LoginForm({ open, onOpenChange }: { open: boolean; onOpenChange?: (open: boolean) => void }) {
  const [count, setCount] = useState(0);
  const [isLoad, setIsLoad] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const [phone, setPhone] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaPassed, setCaptchaPassed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    }
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
        setCount(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        })
      }, 1000)
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
        toast("登录成功");
        onOpenChange?.(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLogin(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>登录</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="phone">手机号</Label>
              <Input id="phone" name="name" placeholder="请输入手机号" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="captcha">验证码</Label>

              <div className="flex justify-center gap-2">
                <Input id="captcha" name="captcha" placeholder="请输入验证码" value={captcha}
                  onChange={(e) => {
                    setCaptcha(e.target.value)
                    setCaptchaPassed(false)
                  }}
                  onBlur={handleVerifyCaptcha} />
                <Button className={captchaPassed ? 'bg-green-500 hover:bg-green-600' : 'bg-black'} disabled={isLoad || captchaPassed} onClick={handleGetCaptcha}>{isLoad ? <Spinner /> : ""}{captchaPassed ? '已通过' : count > 0 ? `${count} 秒后重试` : '获取验证码'}</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button type="submit" disabled={!captchaPassed} onClick={handleLogin}>{isLogin ? <Spinner /> : ''}登录</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}