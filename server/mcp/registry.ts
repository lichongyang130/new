export class MCPRegistry {
  private tools = new Map<string, unknown>();

  register(name: string, tool: unknown) {
    this.tools.set(name, tool);
  }

  get(name: string) {
    return this.tools.get(name);
  }
}
