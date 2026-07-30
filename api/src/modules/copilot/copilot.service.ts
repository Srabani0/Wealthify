import { prisma } from '../../config/prisma.js';
import { SessionService } from './memory/session.service.js';
import { ContextService } from './memory/context.service.js';
import { PromptManager } from './prompts/prompt.manager.js';
import { toolRegistry } from './tools/tool.registry.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { ChatMessageParam, StreamChunk } from './providers/ai.provider.js';
import { SessionContext } from './types/copilot.types.js';

export class CopilotService {
  private aiProvider = new GeminiProvider();

  /**
   * Processes a incoming user message, handles potential tool execution loops,
   * and yields progress chunks for SSE streaming.
   */
  public async *processChatStream(
    sessionId: string,
    userText: string,
    context: SessionContext
  ): AsyncGenerator<StreamChunk, void, unknown> {
    try {
      // 1. Fetch User and Business metadata for Prompt Building
      const [business, user, contextState] = await Promise.all([
        prisma.business.findUnique({ where: { id: context.businessId }, select: { name: true, currency: true } }),
        prisma.user.findUnique({ where: { id: context.userId }, select: { name: true } }),
        ContextService.getContextState(sessionId)
      ]);

      const businessName = business?.name || 'My Business';
      const currency = business?.currency || 'INR';
      const userName = user?.name || 'User';

      // 2. Save user message to database
      await SessionService.saveMessage(sessionId, 'user', userText);

      // 3. Assemble dynamic system prompt
      const systemPrompt = PromptManager.buildSystemPrompt({
        ...context,
        businessName,
        currency,
        userName,
        activeFilters: contextState?.activeFilters,
        lastQueryEntityId: contextState?.lastQueryEntityId
      });

      // 4. Load recent message history for context window
      const history = await SessionService.getSessionMessages(sessionId);
      
      // Map history messages + system prompt
      const messageParams: ChatMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
          name: msg.role === 'tool' ? (msg.toolResults as { name?: string } | null)?.name : undefined,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults
        }))
      ];

      // Retrieve registered tools schema
      const tools = toolRegistry.getAllToolSchemas();

      // 5. Query LLM via streaming provider
      yield { type: 'status', content: 'Thinking...' };
      
      let finalResponseText = '';
      let pendingToolCalls: any[] = [];

      for await (const chunk of this.aiProvider.streamResponse(messageParams, tools)) {
        if (chunk.type === 'tool_call') {
          pendingToolCalls = pendingToolCalls.concat(chunk.toolCalls);
          yield chunk; // Forward tool call notification to frontend
        } else if (chunk.type === 'content') {
          finalResponseText += chunk.content || '';
          yield { type: 'chunk', content: chunk.content }; // Forward text chunk to frontend
        } else if (chunk.type === 'error') {
          yield chunk;
          return;
        }
      }

      // 6. Handle Tool Calling if detected
      if (pendingToolCalls.length > 0) {
        // Save the assistant's intention to call tools
        await SessionService.saveMessage(sessionId, 'assistant', null, pendingToolCalls, null, this.aiProvider.name);

        const toolResultsList: any[] = [];
        let updatedFilters: any = {};
        let updatedEntityId: string | null = null;

        for (const call of pendingToolCalls) {
          yield { type: 'status', content: `Running database search (${call.name})...` };

          try {
            // Securely execute the tool against services
            const result = await toolRegistry.executeTool(call.name, context.businessId, call.args, context.userRole);
            
            // Extract memory variables from inputs
            if (call.args) {
              updatedFilters = { ...updatedFilters, ...call.args };
              if (call.args.customerId) updatedEntityId = call.args.customerId;
              else if (call.args.productId) updatedEntityId = call.args.productId;
              else if (call.args.variantId) updatedEntityId = call.args.variantId;
              else if (call.args.supplierId) updatedEntityId = call.args.supplierId;
              else if (call.args.invoiceId) updatedEntityId = call.args.invoiceId;
            }

            toolResultsList.push({
              name: call.name,
              result
            });

            yield {
              type: 'tool_result',
              toolResult: { name: call.name, data: result }
            };
          } catch (err: any) {
            console.error(`Tool execution error for "${call.name}":`, err);
            toolResultsList.push({
              name: call.name,
              result: { success: false, error: err.message || 'Execution failed' }
            });
          }
        }

        // Save conversation filters and reference context
        await ContextService.updateContextState(sessionId, updatedFilters, updatedEntityId);

        // Save tool responses to memory — wrapped with the tool's own name so
        // the second turn (and any later turn) can correctly attribute this
        // result back to the function that produced it, rather than every
        // tool response looking identical once multiple tools are in play.
        for (const toolRes of toolResultsList) {
          await SessionService.saveMessage(
            sessionId,
            'tool',
            JSON.stringify(toolRes.result),
            null,
            { name: toolRes.name, result: toolRes.result },
            this.aiProvider.name
          );
        }

        // 7. Request LLM to evaluate tool results and generate natural text summary
        yield { type: 'status', content: 'Formulating business insight...' };

        // Re-read full message history including tool messages
        const updatedHistory = await SessionService.getSessionMessages(sessionId);
        const secondTurnMessages: ChatMessageParam[] = [
          { role: 'system', content: systemPrompt },
          ...updatedHistory.slice(-12).map((msg) => ({
            role: msg.role,
            content: msg.content,
            name: msg.role === 'tool' ? (msg.toolResults as { name?: string } | null)?.name : undefined,
            toolCalls: msg.toolCalls,
            toolResults: msg.toolResults
          }))
        ];

        // Second model call: no tools are passed because the evaluation is completed
        let secondTurnText = '';
        for await (const chunk of this.aiProvider.streamResponse(secondTurnMessages, [])) {
          if (chunk.type === 'content') {
            secondTurnText += chunk.content || '';
            yield { type: 'chunk', content: chunk.content };
          } else if (chunk.type === 'error') {
            yield chunk;
            return;
          }
        }

        // Save the final assistant explanation
        await SessionService.saveMessage(sessionId, 'assistant', secondTurnText, null, null, this.aiProvider.name);
      } else {
        // Save the direct text response
        await SessionService.saveMessage(sessionId, 'assistant', finalResponseText, null, null, this.aiProvider.name);
      }
    } catch (error: any) {
      console.error('Critical error in CopilotService chat loop:', error);
      yield { type: 'error', error: error.message || 'Internal server error in Copilot pipeline' };
    }
  }
}
