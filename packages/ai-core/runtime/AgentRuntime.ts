export interface AgentTask {
  id: string;
  input: unknown;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
}

export class AgentRuntime {
  private tasks = new Map<string, AgentTask>();

  createTask(task: AgentTask) {
    this.tasks.set(task.id, task);
    return task;
  }

  async run(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error('Task not found');
    task.status = 'running';
    return task;
  }

  pause(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) task.status = 'paused';
    return task;
  }

  resume(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) task.status = 'running';
    return task;
  }
}
