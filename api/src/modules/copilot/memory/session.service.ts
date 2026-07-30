import { prisma } from '../../../config/prisma.js';
import { NotFoundError } from '../../../lib/errors.js';
import { CopilotSessionDto, CopilotMessageDto } from '../types/copilot.types.js';

export class SessionService {
  /**
   * Verifies a session belongs to the given business/user before any
   * read/write against it — without this, a session id from any business
   * would work against every endpoint (rename/delete/read/chat), since
   * Prisma's `where: { id }` alone doesn't check ownership.
   */
  public static async assertOwnership(sessionId: string, businessId: string, userId: string): Promise<void> {
    const session = await prisma.copilotSession.findFirst({
      where: { id: sessionId, businessId, userId },
      select: { id: true }
    });
    if (!session) throw new NotFoundError('Chat session not found');
  }

  /**
   * Retrieves all chat sessions for a specific user within a business context.
   */
  public static async listSessions(businessId: string, userId: string): Promise<CopilotSessionDto[]> {
    return await prisma.copilotSession.findMany({
      where: { businessId, userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Creates a new chat session.
   */
  public static async createSession(businessId: string, userId: string, title = 'New Conversation'): Promise<CopilotSessionDto> {
    return await prisma.copilotSession.create({
      data: {
        businessId,
        userId,
        title
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Renames a session.
   */
  public static async renameSession(
    sessionId: string,
    businessId: string,
    userId: string,
    title: string
  ): Promise<CopilotSessionDto> {
    await this.assertOwnership(sessionId, businessId, userId);
    return await prisma.copilotSession.update({
      where: { id: sessionId },
      data: { title },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  /**
   * Deletes a chat session along with all associated messages (Cascade).
   */
  public static async deleteSession(sessionId: string, businessId: string, userId: string): Promise<void> {
    await this.assertOwnership(sessionId, businessId, userId);
    await prisma.copilotSession.delete({
      where: { id: sessionId }
    });
  }

  /**
   * Retrieves messages for a specific session.
   */
  public static async getSessionMessages(
    sessionId: string,
    businessId?: string,
    userId?: string
  ): Promise<CopilotMessageDto[]> {
    if (businessId && userId) {
      await this.assertOwnership(sessionId, businessId, userId);
    }
    const messages = await prisma.copilotMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }
    });

    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.content,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
      createdAt: msg.createdAt
    }));
  }

  /**
   * Saves a message to the database.
   */
  public static async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content: string | null,
    toolCalls?: any,
    toolResults?: any,
    modelName?: string
  ): Promise<CopilotMessageDto> {
    const msg = await prisma.copilotMessage.create({
      data: {
        sessionId,
        role,
        content,
        toolCalls: toolCalls ? JSON.parse(JSON.stringify(toolCalls)) : null,
        toolResults: toolResults ? JSON.parse(JSON.stringify(toolResults)) : null,
        modelName
      }
    });

    // Touch the session's updatedAt time
    await prisma.copilotSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    return {
      id: msg.id,
      role: msg.role as 'user' | 'assistant' | 'system' | 'tool',
      content: msg.content,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
      createdAt: msg.createdAt
    };
  }
}
