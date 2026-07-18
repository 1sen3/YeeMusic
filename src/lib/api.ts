export const DEFAULT_API_BASE_URL = normalizeApiBaseUrl(
	import.meta.env.VITE_API_BASE_URL ?? "",
);

let baseUrl = DEFAULT_API_BASE_URL;

export function normalizeApiBaseUrl(url: string) {
	return url.trim().replace(/\/+$/, "");
}

export function setApiBaseUrl(url: string) {
	baseUrl = normalizeApiBaseUrl(url) || DEFAULT_API_BASE_URL;
}

interface RequestOptions extends RequestInit {
	params?: Record<string, string>;
}

const COOKIE_ATTRIBUTE_NAMES = new Set([
	"domain",
	"expires",
	"httponly",
	"max-age",
	"partitioned",
	"path",
	"priority",
	"samesite",
	"secure",
]);

export function sanitizeCookie(cookie: string) {
	const normalizedCookieParts = new Map<string, string>();

	for (const rawPart of cookie.split(";")) {
		const part = rawPart.trim();
		const separatorIndex = part.indexOf("=");
		if (separatorIndex <= 0) continue;

		const name = part.slice(0, separatorIndex).trim();
		const value = part.slice(separatorIndex + 1).trim();
		if (!name || !value) continue;
		if (COOKIE_ATTRIBUTE_NAMES.has(name.toLowerCase())) continue;

		normalizedCookieParts.set(name, value);
	}

	return Array.from(
		normalizedCookieParts,
		([name, value]) => `${name}=${value}`,
	).join("; ");
}

function getDefaultParams(): Record<string, string> {
	if (typeof window === "undefined") return {};

	const defaultParams: Record<string, string> = {
		timestamp: Date.now().toString(),
	};

	const storedCookie = localStorage.getItem("cookie");
	const cookie = storedCookie ? sanitizeCookie(storedCookie) : "";
	if (cookie) {
		defaultParams.cookie = cookie;
		if (cookie !== storedCookie) {
			localStorage.setItem("cookie", cookie);
		}
	}

	return defaultParams;
}

function parseJsonBody(body: BodyInit | null | undefined) {
	if (typeof body !== "string" || !body) return {};

	try {
		return JSON.parse(body) as Record<string, unknown>;
	} catch {
		return {};
	}
}

async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { params = {}, headers, ...rest } = options;
	const method = (rest.method || "GET").toUpperCase();
	const defaultParams = getDefaultParams();
	let requestParams = { ...defaultParams, ...params };
	if (!baseUrl) {
		throw new Error("API 服务地址未配置（VITE_API_BASE_URL）");
	}
	let url = `${baseUrl}${path}`;

	if (rest.body instanceof FormData) {
		for (const [key, value] of Object.entries(requestParams)) {
			rest.body.set(key, value);
		}
		requestParams = {};
	} else if (method !== "GET" && Object.keys(defaultParams).length > 0) {
		rest.body = JSON.stringify({
			...parseJsonBody(rest.body),
			...requestParams,
		});
		requestParams = {};
	}

	if (Object.keys(requestParams).length > 0) {
		const searchParams = new URLSearchParams(requestParams);
		url += `?${searchParams.toString()}`;
	}

	const defaultHeaders: Record<string, string> = {};
	if (!(rest.body instanceof FormData) && rest.body) {
		defaultHeaders["Content-Type"] = "application/json";
	}

	const response = await fetch(url, {
		headers: { ...defaultHeaders, ...headers },
		...rest,
	});

	if (!response.ok) {
		if (response.status === 301) {
			localStorage.removeItem("cookie");
			localStorage.removeItem("userInfo");
			if (window.location.pathname !== "/login") {
				window.location.href = "/login";
			}
		}

		const errorBody = await response.json().catch(() => ({}));
		const msg = errorBody.message || `Request failed: ${response.status}`;
		throw new Error(msg);
	}

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
