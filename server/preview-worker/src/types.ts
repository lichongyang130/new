export type WorkerFramework = "react-vite" | "nextjs";

export interface WorkerFile {
  path: string;
  content: string;
}

export interface StartWorkerSession {
  sessionId: string;
  projectId: string;
  framework: WorkerFramework;
  version: number;
  files: WorkerFile[];
}

export interface UpdateWorkerSession extends StartWorkerSession {
  changedPaths: string[];
}

export interface WorkerHealth {
  healthy: boolean;
  checkedAt: number;
  message?: string;
  cpuPercent?: number;
  memoryBytes?: number;
}

export interface WorkerSession {
  sessionId: string;
  projectId: string;
  framework: WorkerFramework;
  version: number;
  port: number;
  containerName: string;
  workspace: string;
  startedAt: number;
  lastHeartbeatAt: number;
}

export interface WorkerConfig {
  token: string;
  publicPreviewOrigin: string;
  workspaceRoot: string;
  hostPortStart: number;
  hostPortEnd: number;
  previewBindHost: string;
  previewUpstreamHost: string;
  dockerNetwork: string;
  memoryLimit: string;
  cpuLimit: string;
  pidsLimit: number;
  maxSessions: number;
  maxFiles: number;
  maxTotalBytes: number;
  startupTimeoutMs: number;
  port: number;
  host: string;
}

export class WorkerError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = "INVALID_REQUEST"
  ) {
    super(message);
    this.name = "WorkerError";
  }
}
