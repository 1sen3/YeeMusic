const BASE_URL = 'http://101.37.83.226:3000';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  // 1. 处理 URL 参数
  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  // 2. 处理 Headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  // 3. 发起请求
  const response = await fetch(url, {
    headers: { ...defaultHeaders, ...headers },
    ...rest
  })

  // 4. 错误处理
  if (!response.ok) {
    // 未登录
    if (response.status === 301) {
      localStorage.removeItem('cookie');
      localStorage.removeItem('userInfo');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const errorBody = await response.json().catch(() => ({}));
    const msg = errorBody.message || `请求失败：${response.status}`;
    throw new Error(msg);
  }

  // 5. 返回数据
  return response.json();
}

export const api = {
  get: <T>(path: string, params?: Record<string, string>) => http<T>(path, { method: 'GET', params }),

  post: <T>(path: string, data?: any) => http<T>(path, { method: 'POST', body: JSON.stringify(data) }),

  put: <T>(path: string, data?: any) => http<T>(path, { method: 'PUT', body: JSON.stringify(data) }),

  delete: <T>(path: string) => http<T>(path, { method: 'DELETE' })
}