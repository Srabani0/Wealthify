import { create } from 'zustand';
import type { CopilotSession, CopilotMessage } from '../services/copilotApi.js';

interface CopilotState {
  isOpen: boolean;
  activeSessionId: string | null;
  messages: CopilotMessage[];
  sessions: CopilotSession[];
  streamingText: string;
  isThinking: boolean;
  activeToolExecutions: string[]; // List of running tools (e.g. ['getLowStock'])
  statusMessage: string; // Dynamic thinking statuses (e.g. 'Thinking...', 'Running database search...')
  thinkingStartedAt: number | null; // Timestamp the current request started "thinking", for a live elapsed timer
  lastResponseTimeMs: number | null; // How long the most recently completed response took, end to end

  // Actions
  setOpen: (open: boolean) => void;
  setActiveSessionId: (id: string | null) => void;
  setMessages: (messages: CopilotMessage[]) => void;
  addMessage: (message: CopilotMessage) => void;
  setSessions: (sessions: CopilotSession[]) => void;
  addSession: (session: CopilotSession) => void;
  removeSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  setStreamingText: (text: string) => void;
  appendStreamingText: (text: string) => void;
  setIsThinking: (thinking: boolean) => void;
  setStatusMessage: (message: string) => void;
  addToolExecution: (toolName: string) => void;
  removeToolExecution: (toolName: string) => void;
  startThinking: () => void;
  resetStream: () => void;
}

export const useCopilotStore = create<CopilotState>((set) => ({
  isOpen: false,
  activeSessionId: null,
  messages: [],
  sessions: [],
  streamingText: '',
  isThinking: false,
  activeToolExecutions: [],
  statusMessage: '',
  thinkingStartedAt: null,
  lastResponseTimeMs: null,

  setOpen: (isOpen) => set({ isOpen }),

  setActiveSessionId: (activeSessionId) => set({
    activeSessionId,
    messages: [], // Clear message layout when switching sessions
    streamingText: '',
    isThinking: false,
    activeToolExecutions: [],
    statusMessage: '',
    thinkingStartedAt: null,
    lastResponseTimeMs: null
  }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  setSessions: (sessions) => set({ sessions }),
  
  addSession: (session) => set((state) => ({ 
    sessions: [session, ...state.sessions] 
  })),
  
  removeSession: (id) => set((state) => ({ 
    sessions: state.sessions.filter((s) => s.id !== id),
    activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
  })),
  
  updateSessionTitle: (id, title) => set((state) => ({
    sessions: state.sessions.map((s) => s.id === id ? { ...s, title } : s)
  })),
  
  setStreamingText: (streamingText) => set({ streamingText }),
  
  appendStreamingText: (text) => set((state) => ({ 
    streamingText: state.streamingText + text 
  })),
  
  setIsThinking: (isThinking) => set({ isThinking }),
  
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  
  addToolExecution: (toolName) => set((state) => ({
    activeToolExecutions: [...state.activeToolExecutions, toolName]
  })),
  
  removeToolExecution: (toolName) => set((state) => ({
    activeToolExecutions: state.activeToolExecutions.filter((t) => t !== toolName)
  })),

  startThinking: () => set({
    isThinking: true,
    statusMessage: 'Thinking...',
    thinkingStartedAt: Date.now()
  }),

  // Captures how long the just-finished (or just-aborted) response took before
  // clearing thinkingStartedAt, so the UI can briefly show "Answered in X.Xs".
  resetStream: () => set((state) => ({
    streamingText: '',
    isThinking: false,
    activeToolExecutions: [],
    statusMessage: '',
    thinkingStartedAt: null,
    lastResponseTimeMs: state.thinkingStartedAt ? Date.now() - state.thinkingStartedAt : state.lastResponseTimeMs
  }))
}));
