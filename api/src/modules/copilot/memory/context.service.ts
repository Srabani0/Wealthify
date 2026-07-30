import { prisma } from '../../../config/prisma.js';

export class ContextService {
  /**
   * Retrieves the context state for a specific session.
   */
  public static async getContextState(sessionId: string) {
    return await prisma.copilotContextState.findUnique({
      where: { sessionId }
    });
  }

  /**
   * Updates or creates the context state for a session.
   */
  public static async updateContextState(
    sessionId: string,
    activeFilters: any,
    lastQueryEntityId?: string | null
  ) {
    const filters = activeFilters ? JSON.parse(JSON.stringify(activeFilters)) : {};

    return await prisma.copilotContextState.upsert({
      where: { sessionId },
      create: {
        sessionId,
        activeFilters: filters,
        lastQueryEntityId: lastQueryEntityId || null
      },
      update: {
        activeFilters: filters,
        ...(lastQueryEntityId !== undefined ? { lastQueryEntityId } : {})
      }
    });
  }

  /**
   * Clears the context state for a session.
   */
  public static async clearContextState(sessionId: string) {
    try {
      await prisma.copilotContextState.delete({
        where: { sessionId }
      });
    } catch (e) {
      // Ignore if it doesn't exist
    }
  }
}
