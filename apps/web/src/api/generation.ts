export interface GenerationFile {
  path: string;
  content: string;
  language?: "html" | "css" | "javascript" | "json" | "text";
}

export interface GenerateProjectRequest {
  prompt: string;
  projectName: string;
  currentFiles?: GenerationFile[];
}

export interface GenerateProjectResponse {
  name?: string;
  files: GenerationFile[];
  model?: string;
}

const API_BASE = "/api";

export async function generateProjectWithAI(input: GenerateProjectRequest): Promise<GenerateProjectResponse> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("请先描述要生成或修改的内容。");

  const response = await fetch(`${API_BASE}/generation`, {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, prompt }),
  });

  const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
  if (!response.ok) {
    throw new Error(body.message || body.error || `AI 生成服务请求失败（HTTP ${response.status}）。请确认后端已配置并部署。`);
  }

  const result = body as GenerateProjectResponse;
  if (!Array.isArray(result.files) || !result.files.some((file) => file.path === "index.html" && file.content.trim())) {
    throw new Error("AI 服务未返回有效的网页文件，项目未更改。");
  }
  return result;
}
