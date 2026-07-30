import React from 'react';
import { Loader2, Database, Sparkles, Brain } from 'lucide-react';
import { useElapsedTime } from '../../hooks/useElapsedTime.js';

interface TypingAnimationProps {
  status?: string;
  startedAt?: number | null;
}

// Picks an icon that reflects which stage of the pipeline is currently
// running (tool lookup vs. final-answer synthesis vs. plain thinking), so the
// animation reads as real progress rather than a generic spinner.
function stageIcon(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes('database') || lower.includes('search') || lower.includes('running')) {
    return Database;
  }
  if (lower.includes('formulat') || lower.includes('insight')) {
    return Sparkles;
  }
  return Brain;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  status = 'Thinking...',
  startedAt = null
}) => {
  const elapsedSeconds = useElapsedTime(startedAt);
  const Icon = stageIcon(status);

  return (
    <div className="flex items-center space-x-3 py-3 px-4 my-2 max-w-[85%] bg-card border rounded-2xl rounded-tl-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 text-primary relative overflow-hidden">
        <Icon className="h-4 w-4" />
        <Loader2 className="h-7 w-7 absolute animate-spin text-primary/25" />
      </div>

      <div className="flex flex-col space-y-1">
        <span className="text-xs font-semibold text-primary tracking-wide flex items-center gap-1.5">
          {status}
          {startedAt && (
            <span className="text-[10px] font-mono font-medium text-muted-foreground tabular-nums">
              {elapsedSeconds.toFixed(1)}s
            </span>
          )}
        </span>
        <div className="flex space-x-1.5 items-center">
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
};
export default TypingAnimation;
