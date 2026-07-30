import type { Request, Response } from 'express';
import { SessionService } from './memory/session.service.js';
import { ContextService } from './memory/context.service.js';
import { CopilotService } from './copilot.service.js';
import { sendSuccess } from '../../lib/response.js';
import { UnauthorizedError, ValidationError } from '../../lib/errors.js';

const copilotService = new CopilotService();

function requireUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

/**
 * Lists all active Copilot chat sessions for the logged-in user.
 */
export async function listSessions(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const sessions = await SessionService.listSessions(businessId, userId);
  sendSuccess(res, sessions);
}

/**
 * Creates a new Copilot chat session.
 */
export async function createSession(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const { title } = req.body;
  const session = await SessionService.createSession(businessId, userId, title);
  sendSuccess(res, session, 201, 'Chat session created');
}

/**
 * Renames an existing chat session.
 */
export async function renameSession(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const id = req.params.id as string;
  const { title } = req.body;
  if (!title) throw new ValidationError('Title is required to rename session');
  const session = await SessionService.renameSession(id, businessId, userId, title);
  sendSuccess(res, session, 200, 'Chat session renamed');
}

/**
 * Deletes a chat session.
 */
export async function deleteSession(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const id = req.params.id as string;
  await SessionService.deleteSession(id, businessId, userId);
  sendSuccess(res, null, 200, 'Chat session deleted');
}

/**
 * Retrieves past messages for a chat session.
 */
export async function getSessionMessages(req: Request, res: Response) {
  const { businessId, userId } = requireUser(req);
  const id = req.params.id as string;
  const [messages, contextState] = await Promise.all([
    SessionService.getSessionMessages(id, businessId, userId),
    ContextService.getContextState(id),
  ]);
  sendSuccess(res, {
    messages,
    activeFilters: contextState?.activeFilters ?? null,
    lastQueryEntityId: contextState?.lastQueryEntityId ?? null,
  });
}

/**
 * Streams chat responses from the Copilot service via Server-Sent Events (SSE).
 */
export async function chatStream(req: Request, res: Response) {
  const { businessId, userId, role } = requireUser(req);
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    throw new ValidationError('Session ID and message are required');
  }

  await SessionService.assertOwnership(sessionId, businessId, userId);

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/Cloudflare
  res.flushHeaders();

  const context = { businessId, userId, userRole: role };

  try {
    const generator = copilotService.processChatStream(sessionId, message, context);

    for await (const chunk of generator) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      
      // If the client disconnected, break early to free up LLM tokens.
      // Checked on `res` (the outgoing response), not `req` — `req.closed`
      // reflects the incoming request's readable side, which finishes as
      // soon as Express has read the POST body (i.e. almost immediately,
      // long before any response is sent), so checking it here was breaking
      // this loop after the very first chunk on every single request.
      if (res.closed) {
        break;
      }
    }

    res.write('data: {"type":"done"}\n\n');
    res.end();
  } catch (error: any) {
    console.error('SSE Chat stream failed:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Streaming failed' })}\n\n`);
    res.end();
  }
}

/**
 * Logs positive/negative feedback for AI messages.
 */
export async function feedback(req: Request, res: Response) {
  requireUser(req);
  const { messageId, feedback: userFeedback } = req.body;
  if (!messageId || !userFeedback) {
    throw new ValidationError('Message ID and feedback are required');
  }
  
  // Log the feedback securely to server logs for auditing
  console.log(`[Copilot Feedback] User logged feedback: ${userFeedback} for message: ${messageId}`);
  sendSuccess(res, { success: true }, 200, 'Feedback successfully registered.');
}

/**
 * Regenerates the latest AI response for a chat session.
 */
export async function regenerate(req: Request, res: Response) {
  const { businessId, userId, role } = requireUser(req);
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new ValidationError('Session ID is required');
  }

  await SessionService.assertOwnership(sessionId, businessId, userId);

  // 1. Fetch message history
  const messages = await SessionService.getSessionMessages(sessionId);
  
  // Find the index of the last user query
  const lastUserMsgIndex = [...messages].reverse().findIndex(m => m.role === 'user');
  if (lastUserMsgIndex === -1) {
    throw new ValidationError('No user message found to regenerate response for.');
  }

  const lastUserMsgIdx = messages.length - 1 - lastUserMsgIndex;
  const lastUserMsg = messages[lastUserMsgIdx];
  if (!lastUserMsg) {
    throw new ValidationError('No user message found to regenerate response for.');
  }

  // 2. Clear out any subsequent responses/turns in database
  const subsequentMessages = messages.slice(lastUserMsgIdx + 1);
  if (subsequentMessages.length > 0) {
    const idsToDelete = subsequentMessages.map(m => m.id);
    const { prisma } = await import('../../config/prisma.js');
    await prisma.copilotMessage.deleteMany({
      where: { id: { in: idsToDelete } }
    });
  }

  // 3. Open SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const context = { businessId, userId, userRole: role };

  try {
    const generator = copilotService.processChatStream(sessionId, lastUserMsg.content || '', context);

    for await (const chunk of generator) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      if (req.closed) {
        break;
      }
    }

    res.write('data: {"type":"done"}\n\n');
    res.end();
  } catch (error: any) {
    console.error('SSE Regenerate stream failed:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Regeneration failed' })}\n\n`);
    res.end();
  }
}
