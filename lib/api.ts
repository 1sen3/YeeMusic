const BASE_URL = 'http:101.37.83.226:3000';

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
    const errorBody = await response.json().catch(() => ({}));
    const msg = errorBody.message || `请求失败：${response.status}`;
    throw new Error(msg);
  }

  // 5. 返回数据
  return response.json();
}