const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
export const API_BASE = configuredBase
  ? (configuredBase.endsWith("/api") ? configuredBase : `${configuredBase}/api`)
  : "/api";

const localSessionReady = API_BASE === "/api"
  ? fetch("/api/local/session", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => undefined)
  : Promise.resolve();

/** Uses session cookies for same-origin or explicitly configured credentialed APIs. */
export function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return localSessionReady.then(() => fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    credentials: "include",
  }));
}
