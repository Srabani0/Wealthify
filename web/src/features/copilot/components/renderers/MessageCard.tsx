import React, { useState } from 'react';
import type { CopilotMessage } from '../../services/copilotApi.js';
import { TableRenderer } from './TableRenderer.js';
import { MetricCard } from './MetricCard.js';
import { Bot, User, Copy, Check, RotateCw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface MessageCardProps {
  message: CopilotMessage;
  onRegenerate?: () => void;
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
  isLastAssistantMessage?: boolean;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  onRegenerate,
  onFeedback,
  isLastAssistantMessage = false
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const [copied, setCopied] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<'like' | 'dislike' | null>(null);

  // Format date helper
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleCopy = () => {
    if (!message.content) return;
    const cleanText = cleanMessageContent(message.content);
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackClick = (rating: 'like' | 'dislike') => {
    if (localFeedback === rating) return; // Prevent double click
    setLocalFeedback(rating);
    if (onFeedback) {
      onFeedback(message.id, rating);
    }
  };

  // Check if content has custom metric layout: [METRIC: Title | Value | Change | Trend]
  const renderCustomMetrics = (text: string | null) => {
    if (!text) return null;
    const metricRegex = /\[METRIC:\s*([^|]+)\s*\|\s*([^|]+)\s*(?:\|\s*([^|]+)\s*\|\s*([^\]]+))?\]/g;
    const matches = [...text.matchAll(metricRegex)];

    if (matches.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-3 my-3 w-full">
        {matches.map((match, idx) => {
          const title = match[1].trim();
          const value = match[2].trim();
          const change = match[3]?.trim();
          const trend = (match[4]?.trim() as 'up' | 'down' | 'neutral') || 'neutral';

          return (
            <MetricCard
              key={idx}
              title={title}
              value={value}
              change={change}
              trend={trend}
            />
          );
        })}
      </div>
    );
  };

  // Strip metric blocks out of natural text representation
  const cleanMessageContent = (text: string | null) => {
    if (!text) return '';
    return text.replace(/\[METRIC:[^\]]+\]/g, '').trim();
  };

  return (
    <div
      className={`flex w-full space-x-3 my-4 group animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground shadow-sm">
          <Bot className="h-5 w-5" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all duration-200 relative ${
            isUser
              ? 'bg-primary text-primary-foreground rounded-tr-sm font-medium'
              : 'bg-card text-foreground border rounded-tl-sm'
          }`}
        >
          {/* Natural Text representation */}
          <div className="whitespace-pre-wrap">
            {cleanMessageContent(message.content)}
          </div>

          {/* Render parsed elements if assistant */}
          {isAssistant && message.content && (
            <>
              {renderCustomMetrics(message.content)}
              <TableRenderer content={message.content} />
            </>
          )}
        </div>

        {/* Action Controls and Timestamp */}
        <div className="flex items-center space-x-2 mt-1.5 px-1 w-full justify-between">
          <span className="text-[10px] text-muted-foreground font-medium">
            {formattedTime}
          </span>

          {/* Controls for Assistant Messages */}
          {isAssistant && message.id !== 'stream' && (
            <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {/* Copy Button */}
              <button
                onClick={handleCopy}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Copy Response"
              >
                {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
              </button>

              {/* Upvote/Feedback */}
              <button
                onClick={() => handleFeedbackClick('like')}
                className={`p-1 rounded transition-colors ${
                  localFeedback === 'like'
                    ? 'text-success bg-success/15'
                    : 'text-muted-foreground hover:text-success hover:bg-muted'
                }`}
                title="Helpful"
              >
                <ThumbsUp className="h-3 w-3" />
              </button>

              {/* Downvote/Feedback */}
              <button
                onClick={() => handleFeedbackClick('dislike')}
                className={`p-1 rounded transition-colors ${
                  localFeedback === 'dislike'
                    ? 'text-destructive bg-destructive/10'
                    : 'text-muted-foreground hover:text-destructive hover:bg-muted'
                }`}
                title="Not helpful"
              >
                <ThumbsDown className="h-3 w-3" />
              </button>

              {/* Regenerate Response */}
              {isLastAssistantMessage && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  title="Regenerate Response"
                >
                  <RotateCw className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 h-9 w-9 rounded-xl flex items-center justify-center bg-muted text-muted-foreground">
          <User className="h-5 w-5" />
        </div>
      )}
    </div>
  );
};
export default MessageCard;
