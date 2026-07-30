export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  name?: string; // Optional name identifier (important for tool calls / results)
  toolCalls?: any; // Native tool calling parameters from LLM response
  toolResults?: any; // Outputs of the tool executions
}

export interface StreamChunk {
  type: 'content' | 'chunk' | 'tool_call' | 'tool_result' | 'status' | 'error' | 'done';
  content?: string;
  toolCalls?: any;
  toolResult?: any;
  error?: string;
}

export interface AIProvider {
  name: string;

  /**
   * Generates a single blocking response from the LLM.
   */
  generateResponse(
    messages: ChatMessageParam[],
    tools: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{
    content: string | null;
    toolCalls?: any;
    tokensUsed?: number;
  }>;

  /**
   * Generates a streaming response using Server-Sent Events (SSE).
   */
  streamResponse(
    messages: ChatMessageParam[],
    tools: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncIterable<StreamChunk>;
}
