import { ChatMessageParam } from '../providers/ai.provider.js';

export interface ToolProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: {
    type: string;
    enum?: string[];
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolProperty>;
    required: string[];
  };
  execute: (businessId: string, args: any, userRole: string) => Promise<any>;
}

export interface SessionContext {
  businessId: string;
  userId: string;
  userRole: string;
}

export interface CopilotSessionDto {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotMessageDto {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  toolCalls?: any;
  toolResults?: any;
  createdAt: Date;
}
