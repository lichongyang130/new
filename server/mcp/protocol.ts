export interface MCPRequest {
  tool: string;
  input: unknown;
}

export interface MCPResponse {
  success: boolean;
  result: unknown;
}
