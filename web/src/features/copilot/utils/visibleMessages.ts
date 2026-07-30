import type { CopilotMessage } from '../services/copilotApi.js';

/**
 * The persisted message log includes internal plumbing turns that only exist
 * so the LLM can replay its own tool-calling history — an assistant turn with
 * null content (just a "call this tool" intention) and raw `tool` role
 * messages carrying a tool's JSON result. Neither is meant for a human to
 * read; showing them renders as an empty bubble followed by a JSON dump.
 * Live tool-execution progress is already shown separately via the
 * `activeToolExecutions` SSE state, so no information is lost by hiding these.
 */
export function isVisibleMessage(msg: CopilotMessage): boolean {
  if (msg.role === 'tool') return false;
  if (msg.role === 'assistant') return !!msg.content;
  return true;
}
