import axios from "axios";

/** Single source of truth for the external FastAPI backend URL. */
const configuredApiUrl = import.meta.env["VITE_API_BASE_URL"] as string | undefined;
export const API_BASE_URL: string = (configuredApiUrl ?? "http://localhost:8000").replace(/\/+$/, "");

export const TOKEN_KEY = "pulsefolio_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      clearToken();
      if (window.location.pathname !== "/auth") window.location.href = "/auth";
    }
    return Promise.reject(error);
  },
);

export function wsUrl(path = "/ws/live") {
  return `${API_BASE_URL.replace(/^http/, "ws")}${path}`;
}

export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item && typeof item.msg === "string") {
            return item.msg;
          }
          return null;
        })
        .filter((message): message is string => Boolean(message));
      if (messages.length) return messages.join("; ");
    }
    return error.message;
  }
  return fallback;
}
