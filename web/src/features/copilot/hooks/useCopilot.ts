import { useQuery, useQueryClient } from '@tanstack/react-query';
import { copilotApi } from '../services/copilotApi.js';
import type { CopilotMessage } from '../services/copilotApi.js';
import { useCopilotStore } from '../state/copilotStore.js';
import { getToken } from '@/lib/auth.js';
import { useEffect, useRef } from 'react';

export function useCopilot() {
  const queryClient = useQueryClient();
  const activeSessionId = useCopilotStore((s) => s.activeSessionId);
  const messages = useCopilotStore((s) => s.messages);
  const setMessages = useCopilotStore((s) => s.setMessages);
  const addMessage = useCopilotStore((s) => s.addMessage);
  
  const streamingText = useCopilotStore((s) => s.streamingText);
  const isThinking = useCopilotStore((s) => s.isThinking);
  const statusMessage = useCopilotStore((s) => s.statusMessage);
  const activeToolExecutions = useCopilotStore((s) => s.activeToolExecutions);
  const thinkingStartedAt = useCopilotStore((s) => s.thinkingStartedAt);
  const lastResponseTimeMs = useCopilotStore((s) => s.lastResponseTimeMs);

  const setIsThinking = useCopilotStore((s) => s.setIsThinking);
  const setStatusMessage = useCopilotStore((s) => s.setStatusMessage);
  const appendStreamingText = useCopilotStore((s) => s.appendStreamingText);
  const addToolExecution = useCopilotStore((s) => s.addToolExecution);
  const removeToolExecution = useCopilotStore((s) => s.removeToolExecution);
  const startThinking = useCopilotStore((s) => s.startThinking);
  const resetStream = useCopilotStore((s) => s.resetStream);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load message logs + tracked filter/context state of active session via React Query
  const { data: sessionContext, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['copilot', 'messages', activeSessionId],
    queryFn: () => copilotApi.getMessages(activeSessionId!),
    enabled: !!activeSessionId
  });

  // Sync logs into Zustand store
  useEffect(() => {
    if (sessionContext) {
      setMessages(sessionContext.messages);
    }
  }, [sessionContext, setMessages]);

  /**
   * Submits a new user message and processes the SSE stream response from the server.
   *
   * Accepts an optional explicit sessionId — when a brand-new session was just
   * created in the same handler (e.g. the first message of a new chat), the
   * `activeSessionId` captured by this hook's closure can still be stale by the
   * time this runs, so callers pass the freshly-created id straight through
   * instead of relying on the store having re-rendered first.
   */
  const sendMessage = async (content: string, sessionIdOverride?: string) => {
    const targetSessionId = sessionIdOverride ?? activeSessionId;
    if (!targetSessionId || !content.trim()) return;

    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // 1. Instantly append User message to local UI
    const userMsg: CopilotMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString()
    };
    addMessage(userMsg);

    // 2. Set streaming UI states. resetStream() runs first to clear any
    // leftover state from a previous turn — it also flips isThinking back to
    // false, so calling it AFTER startThinking() (as this used to) undid the
    // thinking indicator in the same tick, before the typing animation ever
    // had a chance to render.
    resetStream();
    startThinking();

    try {
      const token = getToken();
      const response = await fetch(copilotApi.getChatStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: targetSessionId,
          message: content
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Readable stream not supported by connection.');

      let buffer = '';
      let accumulatedToolCalls: any[] = [];
      let accumulatedToolResults: any[] = [];

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Save the last partial element for the next batch
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const dataStr = trimmed.slice(6);
            const data = JSON.parse(dataStr);

            switch (data.type) {
              case 'status':
                setStatusMessage(data.content || '');
                break;
              
              case 'tool_call':
                if (data.toolCalls) {
                  accumulatedToolCalls = accumulatedToolCalls.concat(data.toolCalls);
                  data.toolCalls.forEach((call: any) => addToolExecution(call.name));
                }
                break;

              case 'tool_result':
                if (data.toolResult) {
                  accumulatedToolResults.push(data.toolResult);
                  removeToolExecution(data.toolResult.name);
                }
                break;

              case 'content':
              case 'chunk':
                // Streaming text character/token chunk
                setIsThinking(false); // Stop thinking indicator once tokens start flowing
                appendStreamingText(data.content || '');
                break;

              case 'error': {
                // Surface it directly as a message — throwing here would only
                // be caught by the JSON-parse try/catch below, which just
                // logs to console and silently drops it (the bug that made
                // failed requests look like they did nothing at all).
                const errorMsg: CopilotMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: `Sorry, I ran into a problem: ${data.error || 'Server streaming error'}`,
                  createdAt: new Date().toISOString()
                };
                addMessage(errorMsg);
                resetStream();
                break;
              }

              case 'done':
                // Refetch full message log list to ensure database synced state is matched
                queryClient.invalidateQueries({ queryKey: ['copilot', 'messages', targetSessionId] });
                resetStream();
                break;

              default:
                break;
            }
          } catch (e) {
            console.error('Error parsing SSE packet line:', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Chat request stream aborted.');
      } else {
        console.error('SSE Stream subscription error:', err);
        // Append error card to UI
        const errorMsg: CopilotMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered a communication error: ${err.message || 'Please try again later.'}`,
          createdAt: new Date().toISOString()
        };
        addMessage(errorMsg);
      }
    } finally {
      setIsThinking(false);
      setStatusMessage('');
      abortControllerRef.current = null;
    }
  };

  /**
   * Aborts any ongoing stream response.
   */
  const stopResponse = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsThinking(false);
      setStatusMessage('');
      resetStream();
    }
  };

  /**
   * Logs feedback (like/dislike) for a specific assistant message.
   */
  const submitFeedback = async (messageId: string, feedback: 'like' | 'dislike') => {
    try {
      await copilotApi.submitFeedback(messageId, feedback);
    } catch (e) {
      console.error('Failed to log message feedback:', e);
    }
  };

  /**
   * Regenerates the response for the active chat session by re-triggering the stream.
   */
  const regenerateResponse = async () => {
    if (!activeSessionId) return;

    // Find the last user message to keep it in the UI and remove subsequent assistant messages
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const actualIdx = messages.length - 1 - lastUserIdx;

    // Optimistically update local message list: remove everything after that last user message
    setMessages(messages.slice(0, actualIdx + 1));

    // Abort active stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    resetStream();
    startThinking();

    try {
      const token = getToken();
      const response = await fetch(copilotApi.getRegenerateStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: activeSessionId
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('Readable stream not supported.');

      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const dataStr = trimmed.slice(6);
            const data = JSON.parse(dataStr);

            switch (data.type) {
              case 'status':
                setStatusMessage(data.content || '');
                break;
              
              case 'tool_call':
                if (data.toolCalls) {
                  data.toolCalls.forEach((call: any) => addToolExecution(call.name));
                }
                break;

              case 'tool_result':
                if (data.toolResult) {
                  removeToolExecution(data.toolResult.name);
                }
                break;

              case 'content':
              case 'chunk':
                setIsThinking(false);
                appendStreamingText(data.content || '');
                break;

              case 'error': {
                const errorMsg: CopilotMessage = {
                  id: crypto.randomUUID(),
                  role: 'assistant',
                  content: `Sorry, I ran into a problem: ${data.error || 'Server regeneration error'}`,
                  createdAt: new Date().toISOString()
                };
                addMessage(errorMsg);
                resetStream();
                break;
              }

              case 'done':
                queryClient.invalidateQueries({ queryKey: ['copilot', 'messages', activeSessionId] });
                resetStream();
                break;

              default:
                break;
            }
          } catch (e) {
            console.error('Error parsing SSE packet line:', e);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Regenerate response aborted.');
      } else {
        console.error('SSE Stream subscription error:', err);
        const errorMsg: CopilotMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, I encountered a communication error: ${err.message || 'Please try again later.'}`,
          createdAt: new Date().toISOString()
        };
        addMessage(errorMsg);
      }
    } finally {
      setIsThinking(false);
      setStatusMessage('');
      abortControllerRef.current = null;
    }
  };

  return {
    messages,
    isLoadingMessages,
    sendMessage,
    stopResponse,
    submitFeedback,
    regenerateResponse,
    streamingText,
    isThinking,
    statusMessage,
    activeToolExecutions,
    thinkingStartedAt,
    lastResponseTimeMs,
    activeFilters: sessionContext?.activeFilters ?? null,
    lastQueryEntityId: sessionContext?.lastQueryEntityId ?? null
  };
}
export default useCopilot;
