import { GoogleGenAI } from '@google/genai';
import { env } from '../../../config/env.js';
import { AIProvider, ChatMessageParam, StreamChunk } from './ai.provider.js';

// The SDK's ApiError.message is JSON.stringify(errorBody) — and when Google's
// API responds with a non-JSON content-type, errorBody.error.message is
// itself the raw response text (which is usually JSON too), so it can be
// double-encoded. This best-effort unwraps that to find the actual human
// message; failures here just fall back to the raw string, never throw.
function extractApiErrorMessage(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    let parsed = JSON.parse(raw);
    if (typeof parsed?.error?.message === 'string') {
      try {
        const inner = JSON.parse(parsed.error.message);
        if (inner?.error?.message) parsed = inner;
      } catch {
        // parsed.error.message was already plain text, not nested JSON
      }
    }
    return parsed?.error?.message;
  } catch {
    return undefined;
  }
}

// Turns a raw Gemini SDK error into a short, human-readable message — the
// SDK's own error.message is often a wall of nested JSON (quota violation
// details, retry info, etc.) which looks broken if shown to a user directly.
function formatGeminiError(error: any): string {
  const status: number | undefined = error?.status;

  if (status === 429) {
    return "The AI provider's request quota has been used up for now. This is a temporary limit on the Gemini API key, not an app bug — please try again in a little while, or check the quota/billing for this key in Google AI Studio.";
  }
  if (status === 401 || status === 403) {
    return 'The AI provider rejected this request — the configured Gemini API key may be invalid, missing, or lack access to this model.';
  }
  if (typeof status === 'number' && status >= 500) {
    return 'The AI provider is temporarily unavailable. Please try again shortly.';
  }

  return extractApiErrorMessage(error?.message) || error?.message || 'The AI provider request failed unexpectedly.';
}

// @google/generative-ai (the SDK this used to run on) reached end-of-life in
// August 2025 — this now runs on the current unified @google/genai SDK. Model
// name is env-configurable (see GEMINI_MODEL in config/env.ts) since Google
// rotates/retires model aliases frequently; "gemini-flash-latest" is a
// rolling alias that tracks whatever the current GA flash model is, so it
// shouldn't need updating on every rotation.
export class GeminiProvider implements AIProvider {
  public name = 'gemini';
  private client: GoogleGenAI;
  private model: string;

  constructor() {
    const apiKey = env.GEMINI_API_KEY || '';
    if (!apiKey) {
      console.warn('Warning: GEMINI_API_KEY environment variable is not defined.');
    }
    this.model = env.GEMINI_MODEL;
    this.client = new GoogleGenAI({ apiKey });
  }

  /**
   * Helper to map our ChatMessageParam structure to Gemini's SDK Content structure.
   */
  private mapMessagesToGemini(messages: ChatMessageParam[]): { contents: any[]; systemInstruction?: string } {
    let systemInstruction = '';
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // Collect system instructions to send as a configuration parameter
        systemInstruction += (msg.content || '') + '\n';
        continue;
      }

      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // If it contains tool calls from the model. thoughtSignature must be
      // echoed back on the same part for "thinking" models (current Gemini
      // API requirement) — the model rejects the request otherwise with
      // "Function call is missing a thought_signature".
      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (const call of msg.toolCalls) {
          parts.push({
            functionCall: {
              name: call.name,
              args: call.args || {}
            },
            ...(call.thoughtSignature ? { thoughtSignature: call.thoughtSignature } : {})
          });
        }
      }

      // If it is the result of a tool execution (sent back by user/system).
      // The old Generative AI SDK's Gemini API accepted role: 'function' for
      // this; the current API rejects it outright ("Role 'function' is not
      // supported... use SYSTEM, USER, MODEL...") and function responses are
      // sent as a 'user' turn instead.
      if (msg.role === 'tool') {
        const toolResult = msg.toolResults as { name?: string; result?: unknown } | null | undefined;
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: toolResult?.name || msg.name || '',
                response: (toolResult?.result ?? msg.toolResults ?? { success: true }) as Record<string, unknown>
              }
            }
          ]
        });
        continue;
      }

      // Map roles: 'user' is 'user', 'assistant' is 'model'
      const role = msg.role === 'assistant' ? 'model' : 'user';

      if (parts.length > 0) {
        contents.push({ role, parts });
      }
    }

    return {
      contents,
      systemInstruction: systemInstruction.trim() || undefined
    };
  }

  /**
   * Maps our tools configuration schema to Gemini declaration standard.
   */
  private mapToolsToGemini(tools: any[]): any[] {
    if (!tools || tools.length === 0) return [];

    const functionDeclarations = tools.map((tool) => {
      // Map parameters properties
      const properties: Record<string, any> = {};
      const required = tool.parameters?.required || [];

      if (tool.parameters?.properties) {
        for (const [key, prop] of Object.entries(tool.parameters.properties as Record<string, any>)) {
          properties[key] = {
            type: prop.type.toUpperCase(), // Gemini expects uppercase: STRING, NUMBER, OBJECT, etc.
            description: prop.description,
            ...(prop.enum ? { enum: prop.enum } : {})
          };
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'OBJECT',
          properties,
          required
        }
      };
    });

    return [{ functionDeclarations }];
  }

  public async generateResponse(
    messages: ChatMessageParam[],
    tools: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{ content: string | null; toolCalls?: any; tokensUsed?: number }> {
    try {
      const { contents, systemInstruction } = this.mapMessagesToGemini(messages);
      const geminiTools = this.mapToolsToGemini(tools);

      const response = await this.client.models.generateContent({
        model: this.model,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          ...(geminiTools.length > 0 ? { tools: geminiTools } : {}),
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxTokens ?? 2000
        }
      });

      const functionCallParts = (response.candidates?.[0]?.content?.parts ?? []).filter(
        (p: any) => p.functionCall
      );

      return {
        content: response.text || null,
        toolCalls: functionCallParts.length > 0
          ? functionCallParts.map((p: any) => ({
              name: p.functionCall.name,
              args: p.functionCall.args,
              thoughtSignature: p.thoughtSignature
            }))
          : undefined,
        tokensUsed: response.usageMetadata?.totalTokenCount
      };
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      throw new Error(formatGeminiError(error));
    }
  }

  public async *streamResponse(
    messages: ChatMessageParam[],
    tools: any[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncIterable<StreamChunk> {
    try {
      const { contents, systemInstruction } = this.mapMessagesToGemini(messages);
      const geminiTools = this.mapToolsToGemini(tools);

      const stream = await this.client.models.generateContentStream({
        model: this.model,
        contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          ...(geminiTools.length > 0 ? { tools: geminiTools } : {}),
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxTokens ?? 2000
        }
      });

      for await (const chunk of stream) {
        // Read function calls off the raw parts (not the chunk.functionCalls
        // convenience getter) — thoughtSignature lives alongside functionCall
        // on the same part, and that getter doesn't surface it.
        const functionCallParts = (chunk.candidates?.[0]?.content?.parts ?? []).filter(
          (p: any) => p.functionCall
        );
        if (functionCallParts.length > 0) {
          yield {
            type: 'tool_call',
            toolCalls: functionCallParts.map((p: any) => ({
              name: p.functionCall.name,
              args: p.functionCall.args,
              thoughtSignature: p.thoughtSignature
            }))
          };
        }

        // If the chunk contains actual text content
        const text = chunk.text;
        if (text) {
          yield {
            type: 'content',
            content: text
          };
        }
      }
    } catch (error: any) {
      console.error('Error streaming from Gemini API:', error);
      yield {
        type: 'error',
        error: formatGeminiError(error)
      };
    }
  }
}
