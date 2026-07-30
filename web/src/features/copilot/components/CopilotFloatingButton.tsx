import React from 'react';
import { useCopilotStore } from '../state/copilotStore.js';
import { Bot, Sparkles } from 'lucide-react';

export const CopilotFloatingButton: React.FC = () => {
  const isOpen = useCopilotStore((s) => s.isOpen);
  const setOpen = useCopilotStore((s) => s.setOpen);

  if (isOpen) return null;

  return (
    <button
      onClick={() => setOpen(true)}
      className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground shadow-elevated hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group"
      title="Open Business Copilot"
    >
      <Bot className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-secondary-foreground animate-pulse">
        <Sparkles className="h-2 w-2" />
      </div>
    </button>
  );
};
export default CopilotFloatingButton;
