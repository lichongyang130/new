import type { DesignProject } from "../models/project";
import { apiFetch } from "../../../apps/web/src/api/client";

export async function saveProjectToCloud(project: DesignProject): Promise<void> {
  const response = await apiFetch("/projects", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      id: project.id,
      name: project.name,
      prompt: project.prompt,
      files: project.files,
      designSystemId: project.designSystemId,
      workspaceName: project.workspaceName,
      executionPolicy: project.executionPolicy,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      status: project.status,
    }),
  });

  const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
  if (!response.ok) {
    throw new Error(body.message || body.error || `云端保存失败（HTTP ${response.status}）。请确认项目 API 已配置。`);
  }
  if (body && typeof body === "object" && "saved" in body && body.saved !== true) {
    throw new Error("服务器未确认项目已保存。");
  }
}

export async function listCloudProjects(): Promise<DesignProject[]> {
  const response = await apiFetch("/projects", { headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
  if (!response.ok) throw new Error(body.message || body.error || `加载共享项目失败（HTTP ${response.status}）。`);
  return (Array.isArray(body) ? body : []).filter((project): project is DesignProject => Boolean(project && typeof project === "object" && typeof project.id === "string" && typeof project.name === "string" && Array.isArray(project.files)))
    .map((project) => ({ ...project, files: project.files.map((file) => ({ ...file, language: file.language ?? (file.path.endsWith(".html") ? "html" : file.path.endsWith(".css") ? "css" : file.path.endsWith(".js") ? "javascript" : "text") })) }));
}

export async function getCloudProject(projectId: string): Promise<DesignProject> {
  const response = await apiFetch(`/projects/${encodeURIComponent(projectId)}`, { headers: { Accept: "application/json" } });
  const body = await response.json().catch(() => ({} as { error?: string }));
  if (!response.ok) throw new Error(body.error || `加载共享项目失败 (${response.status})`);
  return body as DesignProject;
}
