import { api } from '@/lib/axios';
import { env } from '@/config/env';

export interface CopilotSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  toolCalls?: any;
  toolResults?: any;
  createdAt: string;
}

export interface CopilotSessionContext {
  messages: CopilotMessage[];
  activeFilters: Record<string, unknown> | null;
  lastQueryEntityId: string | null;
}

export const copilotApi = {
  /**
   * Retrieves all chat sessions.
   */
  async listSessions(): Promise<CopilotSession[]> {
    const { data } = await api.get('/ai/conversations');
    return data.data;
  },

  /**
   * Creates a new chat session.
   */
  async createSession(title?: string): Promise<CopilotSession> {
    const { data } = await api.post('/ai/conversations', { title });
    return data.data;
  },

  /**
   * Renames an existing chat session.
   */
  async renameSession(id: string, title: string): Promise<CopilotSession> {
    const { data } = await api.patch(`/ai/conversation/${id}`, { title });
    return data.data;
  },

  /**
   * Deletes a chat session.
   */
  async deleteSession(id: string): Promise<void> {
    await api.delete(`/ai/conversation/${id}`);
  },

  /**
   * Fetches messages and the tracked filter/context state of a session.
   */
  async getMessages(id: string): Promise<CopilotSessionContext> {
    const { data } = await api.get(`/ai/conversation/${id}`);
    return data.data;
  },

  /**
   * Logs feedback for a message.
   */
  async submitFeedback(messageId: string, feedback: 'like' | 'dislike'): Promise<void> {
    await api.post('/ai/feedback', { messageId, feedback });
  },

  /**
   * Initiates SSE stream connection.
   */
  getChatStreamUrl(): string {
    return `${env.VITE_API_BASE_URL}/ai/chat`;
  },

  /**
   * Initiates SSE stream connection for regenerating response.
   */
  getRegenerateStreamUrl(): string {
    return `${env.VITE_API_BASE_URL}/ai/regenerate`;
  }
};
