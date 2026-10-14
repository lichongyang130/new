import type { Connector } from "../models/workspace";
import { apiFetch } from "../../../apps/web/src/api/client";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `Connector API failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listConnectors(): Promise<Connector[]> {
  return request<Connector[]>("/connectors");
}

/** Backend should return a provider-hosted authorization URL; never handle provider secrets in the browser. */
export function beginConnectorOAuth(provider: Connector["provider"], returnTo = window.location.href): Promise<{ authorizationUrl: string }> {
  return request<{ authorizationUrl: string }>("/connectors/oauth/start", {
    method: "POST",
    body: JSON.stringify({ provider, returnTo }),
  });
}

export function disconnectConnector(id: string): Promise<void> {
  return request<void>(`/connectors/${encodeURIComponent(id)}/disconnect`, { method: "POST" });
}
