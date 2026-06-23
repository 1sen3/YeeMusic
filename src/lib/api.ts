const BASE_URL = "http://101.37.83.226:3000";

interface RequestOptions extends RequestInit {
	params?: Record<string, string>;
}

async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { params = {}, headers, ...rest } = options;

	// 自动携带 cookie 和 timestamp
	if (typeof window !== "undefined") {
		const cookie = localStorage.getItem("cookie");
		if (cookie) {
			params.cookie = cookie;
			params.timestamp = Date.now().toString();
		}
	}
	// 处理 URL 参数
	let url = `${BASE_URL}${path}`;
	if (Object.keys(params).length > 0) {
		const searchParams = new URLSearchParams(params);
		url += `?${searchParams.toString()}`;
	}

	// 处理 Headers
	const defaultHeaders: Record<string, string> = {};

	// 如果是普通对象且不是 FormData，则加上 application/json 并且转换为字符串
	if (!(rest.body instanceof FormData) && rest.body) {
		defaultHeaders["Content-Type"] = "application/json";
	}
	// 如果是 FormData，fetch 会自动去计算并挂载带 boundary 的 multipart/form-data，无需手动指定 Content-Type

	// 发起请求
	const response = await fetch(url, {
		headers: { ...defaultHeaders, ...headers },
		...rest,
	});

	// 错误处理
	if (!response.ok) {
		// 未登录
		if (response.status === 301) {
			localStorage.removeItem("cookie");
			localStorage.removeItem("userInfo");
			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
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
	get: <T>(
		path: string,
		params?: Record<string, string>,
		options?: RequestInit,
	) => http<T>(path, { method: "GET", params, ...options }),

	post: <T>(
		path: string,
		data?: Record<string, unknown> | FormData,
		options?: Omit<RequestOptions, "method" | "body">,
	) => {
		const isFormData = data instanceof FormData;
		return http<T>(path, {
			method: "POST",
			body: isFormData ? data : JSON.stringify(data),
			...options,
		});
	},

	put: <T>(path: string, data?: Record<string, string>) =>
		http<T>(path, { method: "PUT", body: JSON.stringify(data) }),

	delete: <T>(path: string) => http<T>(path, { method: "DELETE" }),
};
