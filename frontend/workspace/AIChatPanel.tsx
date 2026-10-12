export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatPanel({ messages }: { messages: ChatMessage[] }) {
  return {
    type: 'AIChatPanel',
    messages
  };
}
