import { generateDesignProject, type GenerationFile } from "./generation";

export interface ApiPrincipal {
  id: string;
}

export interface ApiProject {
  id: string;
  name: string;
  prompt: string;
  files: GenerationFile[];
  designSystemId?: string;
  workspaceName?: string;
  executionPolicy?: string;
  createdAt: string;
  updatedAt: string;
  status: "draft";
}

export interface ProjectRepository {
  listByOwner(ownerId: string): Promise<ApiProject[]>;
  getById(ownerId: string, projectId: string): Promise<ApiProject | null>;
  save(ownerId: string, project: ApiProject): Promise<ApiProject>;
  delete(ownerId: string, projectId: string): Promise<boolean>;
}

export interface ApiHandlerOptions {
  authenticate(request: Request): Promise<ApiPrincipal | null>;
  projects: ProjectRepository;
  corsOrigin?: string;
}

function json(data: unknown, status = 200, origin?: string): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  return new Response(JSON.stringify(data), { status, headers });
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) throw new Error("Content-Type must be application/json.");
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Request body must be a JSON object.");
  return body as Record<string, unknown>;
}

function asProject(value: Record<string, unknown>): ApiProject {
  if (typeof value.id !== "string" || !value.id.trim()) throw new Error("Project id is required.");
  if (typeof value.name !== "string" || !value.name.trim()) throw new Error("Project name is required.");
  if (typeof value.prompt !== "string" || !Array.isArray(value.files)) throw new Error("Project prompt and files are required.");
  if (value.files.length > 200) throw new Error("Project contains too many files.");

  let total = 0;
  const files = value.files.map((item): GenerationFile => {
    if (!item || typeof item !== "object" || !("path" in item) || !("content" in item)) throw new Error("Invalid project file.");
    const file = item as { path: unknown; content: unknown };
    if (typeof file.path !== "string" || !file.path.trim() || file.path.startsWith("/") ||
        file.path.replace(/\\/g, "/").split("/").includes("..")) {
      throw new Error("Project contains an unsafe file path.");
    }
    if (typeof file.content !== "string") throw new Error("Project file content must be text.");
    total += new TextEncoder().encode(file.content).length;
    if (total > 2_000_000) throw new Error("Project source exceeds the 2 MB limit.");
    return { path: file.path, content: file.content };
  });

  const now = new Date().toISOString();
  return {
    id: value.id.trim(),
    name: value.name.trim().slice(0, 120),
    prompt: value.prompt.slice(0, 12_000),
    files,
    ...(typeof value.designSystemId === "string" ? { designSystemId: value.designSystemId.slice(0, 120) } : {}),
    ...(typeof value.workspaceName === "string" ? { workspaceName: value.workspaceName.slice(0, 120) } : {}),
    ...(typeof value.executionPolicy === "string" ? { executionPolicy: value.executionPolicy.slice(0, 120) } : {}),
    createdAt: typeof value.createdAt === "string" ? value.createdAt : now,
    updatedAt: now,
    status: "draft",
  };
}

/**
 * Mount this handler under /api in the host server. A real session authenticator
 * and durable project repository must be supplied by the deployment.
 */
export function createApiHandler(options: ApiHandlerOptions): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const origin = request.headers.get("origin");
    if (request.method === "OPTIONS") {
      const headers = new Headers({
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "600",
      });
      if (options.corsOrigin && origin === options.corsOrigin) {
        headers.set("Access-Control-Allow-Origin", options.corsOrigin);
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Vary", "Origin");
      }
      return new Response(null, { status: 204, headers });
    }

    if (!url.pathname.startsWith("/api/")) return json({ error: "Not found." }, 404);
    if (options.corsOrigin && origin && origin !== options.corsOrigin) return json({ error: "Origin not allowed." }, 403);

    let principal: ApiPrincipal | null;
    try {
      principal = await options.authenticate(request);
    } catch {
      return json({ error: "Unable to authenticate request." }, 401, options.corsOrigin);
    }
    if (!principal?.id) return json({ error: "Authentication required." }, 401, options.corsOrigin);

    try {
      if (url.pathname === "/api/generation" && request.method === "POST") {
        const body = await readJson(request);
        if (typeof body.prompt !== "string" || typeof body.projectName !== "string") {
          return json({ error: "prompt and projectName are required." }, 400, options.corsOrigin);
        }
        const currentFiles = Array.isArray(body.currentFiles) ? body.currentFiles as GenerationFile[] : [];
        const result = await generateDesignProject({
          userId: principal.id,
          prompt: body.prompt,
          projectName: body.projectName,
          model: typeof body.model === "string" ? body.model : undefined,
          currentFiles,
        });
        return json(result, 200, options.corsOrigin);
      }

      if (url.pathname === "/api/projects" && request.method === "GET") {
        return json(await options.projects.listByOwner(principal.id), 200, options.corsOrigin);
      }
      if (url.pathname === "/api/projects" && request.method === "POST") {
        const project = asProject(await readJson(request));
        const saved = await options.projects.save(principal.id, project);
        return json({ saved: true, project: saved }, 200, options.corsOrigin);
      }

      const projectPath = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
      if (projectPath) {
        const id = decodeURIComponent(projectPath[1]);
        if (request.method === "GET") {
          const project = await options.projects.getById(principal.id, id);
          return project ? json(project, 200, options.corsOrigin) : json({ error: "Project not found." }, 404, options.corsOrigin);
        }
        if (request.method === "DELETE") {
          const deleted = await options.projects.delete(principal.id, id);
          return deleted ? json({ deleted: true }, 200, options.corsOrigin) : json({ error: "Project not found." }, 404, options.corsOrigin);
        }
        if (request.method === "PUT") {
          const project = asProject(await readJson(request));
          if (project.id !== id) return json({ error: "Project id mismatch." }, 400, options.corsOrigin);
          const existing = await options.projects.getById(principal.id, id);
          if (!existing) return json({ error: "Project not found." }, 404, options.corsOrigin);
          const saved = await options.projects.save(principal.id, project);
          return json({ saved: true, project: saved }, 200, options.corsOrigin);
        }
      }
      return json({ error: "Not found." }, 404, options.corsOrigin);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed.";
      const status = /required|must be|invalid|too (long|many|large)|unsafe|exceeds/i.test(message) ? 400 : 502;
      return json({ error: message }, status, options.corsOrigin);
    }
  };
}
