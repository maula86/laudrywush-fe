import { clearSession, getAccessToken, getRefreshToken, setTokens } from "@/lib/api/auth-store";
import type { RefreshResponse } from "@/lib/api/types";

const SERVER_API_BASE_URL = "http://localhost:3001";
const configuredBaseUrl = import.meta.env["VITE_API_BASE_URL"]?.trim();

/**
 * Browser requests use the Vite `/api` proxy, keeping calls same-origin even
 * when Vite selects port 8082. SSR has no browser origin, so it calls Bun
 * directly. A deployment can override either path with `VITE_API_BASE_URL`.
 */
export const API_BASE_URL = configuredBaseUrl
  ? configuredBaseUrl
  : typeof window === "undefined"
    ? SERVER_API_BASE_URL
    : window.location.origin;

type QueryValue = string | number | boolean | null | undefined;
type QueryParamEntry = QueryValue | readonly QueryValue[];
type QueryParams = Record<string, QueryParamEntry>;

type RequestOptions = {
  readonly auth?: boolean;
  readonly query?: QueryParams;
  readonly signal?: AbortSignal;
};

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

type ApiRequest = RequestOptions & {
  readonly method: HttpMethod;
  readonly body?: unknown;
  readonly retryOnUnauthorized: boolean;
};

type ApiErrorBody = {
  readonly error: string;
  readonly message: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let refreshPromise: Promise<boolean> | null = null;

const appendQueryValue = (url: URL, key: string, value: QueryValue): void => {
  if (value === null || value === undefined) return;
  url.searchParams.append(key, String(value));
};

const isQueryValueArray = (value: QueryParamEntry): value is readonly QueryValue[] =>
  Array.isArray(value);

const buildUrl = (path: string, query?: QueryParams): URL => {
  const baseUrl = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;
  const apiPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(apiPath, baseUrl);

  if (!query) return url;

  for (const [key, value] of Object.entries(query)) {
    if (isQueryValueArray(value)) {
      for (const item of value) appendQueryValue(url, key, item);
      continue;
    }
    appendQueryValue(url, key, value);
  }

  return url;
};

const statusCode = (status: number): string => {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 500) return "internal_error";
  if (status === 503) return "service_unavailable";
  return `http_${status}`;
};

const isApiErrorBody = (value: unknown): value is ApiErrorBody => {
  if (typeof value !== "object" || value === null) return false;
  if (!("error" in value) || !("message" in value)) return false;
  return typeof value.error === "string" && typeof value.message === "string";
};

const parseJsonText = (text: string): unknown => {
  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) return null;
    throw error;
  }
};

const readError = async (response: Response): Promise<ApiError> => {
  const text = await response.text();
  const body = text ? parseJsonText(text) : null;
  const code = isApiErrorBody(body) ? body.error : statusCode(response.status);
  const message = isApiErrorBody(body) ? body.message : response.statusText || code;
  return new ApiError(response.status, code, message);
};

const readSuccess = async <T>(response: Response): Promise<T | undefined> => {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  const parsed: T = JSON.parse(text) as T;
  return parsed;
};

const refreshTokens = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await sendRequest<RefreshResponse>("/api/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refreshToken },
    retryOnUnauthorized: false,
  });

  if (!response) return false; // Should never happen; defensive guard.
  setTokens(response);
  return true;
};

const getRefreshPromise = (): Promise<boolean> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshTokens().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const sendRequest = async <T>(path: string, request: ApiRequest): Promise<T | undefined> => {
  const auth = request.auth ?? true;
  const headers = new Headers({ Accept: "application/json" });
  const accessToken = getAccessToken();

  if (request.body !== undefined) headers.set("Content-Type", "application/json");
  if (auth && accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const init: RequestInit = {
    method: request.method,
    headers,
    credentials: "include",
  };

  if (request.body !== undefined) init.body = JSON.stringify(request.body);
  if (request.signal) init.signal = request.signal;

  const response = await fetch(buildUrl(path, request.query), init);
  if (response.ok) return readSuccess<T>(response);

  const error = await readError(response);
  if (!auth || error.status !== 401 || !request.retryOnUnauthorized) throw error;

  const refreshed = await getRefreshPromise();
  if (!refreshed) {
    clearSession();
    throw error;
  }

  try {
    return await sendRequest<T>(path, { ...request, retryOnUnauthorized: false });
  } catch (retryError) {
    if (retryError instanceof ApiError && retryError.status === 401) clearSession();
    throw retryError;
  }
};

export const apiGet = <T>(path: string, options: RequestOptions = {}): Promise<T | undefined> =>
  sendRequest<T>(path, { ...options, method: "GET", retryOnUnauthorized: true });

export const apiPost = <T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T | undefined> =>
  sendRequest<T>(path, { ...options, method: "POST", body, retryOnUnauthorized: true });

export const apiPatch = <T>(
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<T | undefined> =>
  sendRequest<T>(path, { ...options, method: "PATCH", body, retryOnUnauthorized: true });

export const apiDelete = <T>(path: string, options: RequestOptions = {}): Promise<T | undefined> =>
  sendRequest<T>(path, { ...options, method: "DELETE", retryOnUnauthorized: true });
