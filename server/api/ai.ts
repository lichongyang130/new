export interface AIRequest {
  model: string;
  prompt: string;
  userId: string;
}

export interface AIResponse {
  content: string;
  model: string;
}

export async function requestAI(input: AIRequest): Promise<AIResponse> {
  // Provider adapter can connect OpenAI, Claude, DeepSeek or Ollama.
  return {
    content: `AI response generated for: ${input.prompt}`,
    model: input.model,
  };
}
