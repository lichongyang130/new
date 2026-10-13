export const workspaceRoutes = {
  home: "/",
  experts: "/experts",
  myExperts: "/experts/mine",
  createExpert: "/experts/create",
  expertDetail: (id: string) => `/experts/${encodeURIComponent(id)}`,
  skills: "/skills",
  createSkill: "/skills/create",
  connectors: "/connectors",
  connectorOAuth: "/connectors/oauth",
} as const;

export type WorkspaceRouteKey = keyof typeof workspaceRoutes;

export function navigateTo(path: string): void {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function resolveWorkspaceRoute(pathname: string): { section: "home" | "experts" | "skills" | "connectors"; page: string; id?: string } {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/experts/create") return { section: "experts", page: "create" };
  if (path === "/experts/mine") return { section: "experts", page: "mine" };
  if (path === "/experts") return { section: "experts", page: "marketplace" };
  const expert = path.match(/^\/experts\/([^/]+)$/);
  if (expert) return { section: "experts", page: "detail", id: decodeURIComponent(expert[1]) };
  if (path === "/skills/create") return { section: "skills", page: "create" };
  if (path === "/skills") return { section: "skills", page: "marketplace" };
  if (path === "/connectors/oauth") return { section: "connectors", page: "oauth" };
  if (path === "/connectors") return { section: "connectors", page: "marketplace" };
  return { section: "home", page: "home" };
}
