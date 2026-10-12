import { WorkflowNode } from './WorkflowNode';
import { WorkflowExecutor } from './WorkflowExecutor';
import { ExecutionContext } from './ExecutionContext';

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
}

export class WorkflowEngine {
  private executor = new WorkflowExecutor();

  async run(workflow: WorkflowDefinition) {
    const context = new ExecutionContext();

    const orderedNodes = this.resolveDependencies(workflow.nodes);

    return this.executor.execute(orderedNodes, context);
  }

  save(workflow: WorkflowDefinition) {
    return JSON.stringify(workflow);
  }

  private resolveDependencies(nodes: WorkflowNode[]) {
    return [...nodes].sort((a, b) =>
      a.dependencies.length - b.dependencies.length
    );
  }
}
