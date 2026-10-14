export type TaskReplyStatus = "waiting" | "streaming" | "complete" | "error" | "stopped" | "local";
export interface TaskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  requestContent?: string;
  createdAt: string;
  status: TaskReplyStatus;
  elapsedMs?: number;
  model?: string;
  error?: string;
  feedback?: "up" | "down";
  artifact?: boolean;
}
export interface TaskConversation {
  projectId: string;
  mode: "office" | "code" | "design";
  model: string;
  permission: string;
  messages: TaskMessage[];
}
const key = (id: string) => `designbuddy.conversation.v1.${id}`;
export const pendingTaskKey = (id: string) => `designbuddy.conversation.pending.${id}`;

export function loadTaskConversation(id: string): TaskConversation | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(id)) || "null") as TaskConversation | null;
    if (!value || value.projectId !== id || !["office", "code", "design"].includes(value.mode) || !Array.isArray(value.messages) || typeof value.model !== "string" || typeof value.permission !== "string") return null;
    if (!value.messages.every((item) => item && typeof item.id === "string" && ["user", "assistant"].includes(item.role) && typeof item.content === "string" && typeof item.createdAt === "string" && ["waiting", "streaming", "complete", "error", "stopped", "local"].includes(item.status))) return null;
    return { ...value, messages: value.messages.map((item) => item.status === "waiting" || item.status === "streaming" ? { ...item, status: "stopped", error: "上次回复已中断，可重新生成。" } : item) };
  } catch { return null; }
}

export function saveTaskConversation(task: TaskConversation): void {
  localStorage.setItem(key(task.projectId), JSON.stringify(task));
}
export function projectTaskPath(id: string): string {
  return `${loadTaskConversation(id) ? "/tasks/" : "/editor/"}${encodeURIComponent(id)}`;
}
