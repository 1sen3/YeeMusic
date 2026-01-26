import { api } from "../api";
import { Account, UserProfile } from "../types";

interface LoginResponse {
  code: number;
  cookie: string;
  profile: UserProfile;
}

interface RefeshResponse {
  code: number;
  cookie: string;
}

interface VerifyCaptchaResponse {
  code: number;
  message: string;
}

interface LoginStatusResponse {
  code: number;
  account: Account;
  profile: UserProfile;
}

export async function sentCaptcha(phone: string) {
  return api.get('/captcha/sent', { phone });
}

export async function verifyCaptcha(phone: string, captcha: string) {
  return api.get<VerifyCaptchaResponse>('/captcha/verify', { phone, captcha });
}

export async function loginByPhone(phone: string, captcha: string) {
  const res = await api.post<LoginResponse>('/login/cellphone', { phone, captcha });
  if (res.code === 200 && res.cookie) {
    localStorage.setItem('cookie', res.cookie);
    localStorage.setItem('userInfo', JSON.stringify(res.profile));
  }
  return res;
}

export async function loginByEmail(email: string, md5_password: string) {
  const res = await api.post<LoginResponse>('/login', { email, md5_password });
  if (res.code === 200 && res.cookie) {
    localStorage.setItem('cookie', res.cookie);
    localStorage.setItem('userInfo', JSON.stringify(res.profile));
  }
  return res;
}

export async function refreshLogin() {
  const res = await api.get<RefeshResponse>('/login/refresh');
  if (res.code === 200 && res.cookie) {
    localStorage.setItem('cookie', res.cookie);
  }
  return res;
}

export async function loginStatus() {
  const res = await api.get<LoginStatusResponse>('/login/status');

  if (res.code === 200 && res.profile) {
    localStorage.setItem('userInfo', JSON.stringify(res.profile));
  }

  return res;
}

export async function logout() {
  return api.get('/logout');
}

// 二维码登录接口
interface QrKeyResponse {
  code: number;
  data: {
    code: number;
    unikey: string;
  }
}

interface QrImgResponse {
  code: number;
  data: {
    qrurl: string;
    qrimg: string;
  }
}

interface QrCheckResponse {
  code: number;
  message: string;
  cookie: string;
}

export async function getQrKey() {
  const timestamp = new Date().getTime();
  return api.get<QrKeyResponse>('/login/qr/key', { timestamp: timestamp.toString() });
}

export async function createQrImg(key: string) {
  const timestamp = new Date().getTime();
  return api.get<QrImgResponse>('/login/qr/create', { key, qrimg: 'true', timestamp: timestamp.toString() })
}

export async function checkQrStatus(key: string) {
  const timestamp = new Date().getTime();
  const res = await api.get<QrCheckResponse>('/login/qr/check', { key, timestamp: timestamp.toString() });

  if (res.code === 803 && res.cookie) {
    localStorage.setItem('cookie', res.cookie);
    await loginStatus();
  }

  return res;
}