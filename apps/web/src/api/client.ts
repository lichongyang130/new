const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
export const API_BASE = configuredBase
  ? (configuredBase.endsWith("/api") ? configuredBase : `${configuredBase}/api`)
  : "/api";

/** Uses session cookies for same-origin or explicitly configured credentialed APIs. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    credentials: "include",
  });
}
