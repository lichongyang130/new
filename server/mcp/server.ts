import { MCPRegistry } from './registry';

export class MCPServer {
  constructor(private registry: MCPRegistry) {}

  async call(tool: string, input: unknown) {
    const handler = this.registry.get(tool);

    return {
      tool,
      input,
      available: !!handler
    };
  }
}
