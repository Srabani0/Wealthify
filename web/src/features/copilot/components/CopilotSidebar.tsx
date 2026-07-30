import React, { useState, useEffect, useRef } from 'react';
import { useCopilotStore } from '../state/copilotStore.js';
import { useCopilot } from '../hooks/useCopilot.js';
import { useCopilotHistory } from '../hooks/useCopilotHistory.js';
import { MessageCard } from './renderers/MessageCard.js';
import { TypingAnimation } from './renderers/TypingAnimation.js';
import { isVisibleMessage } from '../utils/visibleMessages.js';
import {
  X, Send, Plus, Trash2, Edit3, Check, MessageSquare, Sparkles,
  ChevronRight, Bot, SidebarClose, History, Pin, PinOff, Search
} from 'lucide-react';

const SUGGESTIONS = [
  'Show low stock products',
  'What is our order count?',
  'Show order summary',
  'Compare revenue this month',
  "Show today's business summary",
  "Show unpaid invoices"
];

export const CopilotSidebar: React.FC = () => {
  const isOpen = useCopilotStore((s) => s.isOpen);
  const setOpen = useCopilotStore((s) => s.setOpen);
  const streamingText = useCopilotStore((s) => s.streamingText);

  const {
    messages,
    sendMessage,
    isThinking,
    statusMessage,
    stopResponse,
    submitFeedback,
    regenerateResponse,
    thinkingStartedAt,
    lastResponseTimeMs
  } = useCopilot();

  const {
    sessions,
    isLoading: isLoadingHistory,
    activeSessionId,
    setActiveSessionId,
    createSession,
    renameSession,
    deleteSession
  } = useCopilotHistory();

  const [inputVal, setInputVal] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pinnedSessionIds, setPinnedSessionIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load pinned state from localStorage on init
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wealthify_copilot_pinned');
      if (stored) {
        setPinnedSessionIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse pinned sessions:', e);
    }
  }, []);

  // Save pinned state to localStorage on update
  const togglePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (pinnedSessionIds.includes(id)) {
      updated = pinnedSessionIds.filter(pid => pid !== id);
    } else {
      updated = [...pinnedSessionIds, id];
    }
    setPinnedSessionIds(updated);
    localStorage.setItem('wealthify_copilot_pinned', JSON.stringify(updated));
  };

  // Only user messages and real (non-empty) assistant answers are shown to
  // the user — internal tool-call/tool-result turns are LLM replay plumbing.
  const visibleMessages = messages.filter(isVisibleMessage);

  // Find the last assistant message ID to enable regeneration
  const lastAssistantId = [...visibleMessages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id;

  // Auto-scroll chat area on new message or text chunk
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isThinking, statusMessage]);

  // Set default session if activeSessionId is null and sessions exist
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions, setActiveSessionId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const content = inputVal.trim();
    setInputVal('');

    const sessionId = activeSessionId ?? (await createSession('New Conversation')).id;
    sendMessage(content, sessionId);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    const sessionId = activeSessionId ?? (await createSession('New Conversation')).id;
    sendMessage(suggestion, sessionId);
  };

  const handleStartRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      renameSession(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteSession(id);
    }
  };

  const handleNewChat = () => {
    createSession('New Conversation');
    setShowHistoryPanel(false);
  };

  // Sort sessions: Pinned ones at the top, then sorted by updated timestamp
  const sortedSessions = [...sessions].sort((a, b) => {
    const aPinned = pinnedSessionIds.includes(a.id);
    const bPinned = pinnedSessionIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  // Filter sessions by search query
  const filteredSessions = sortedSessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex h-full w-[450px] max-w-full flex-col border-l bg-background/95 backdrop-blur-xl shadow-elevated transition-all duration-300 ease-out">

      {/* HEADER SECTION */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-card/50 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center">
              Wealthify Copilot
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-primary/10 text-primary">
                AI Assistant
              </span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium">Real-time business insights</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className={`p-2 rounded-lg transition-colors duration-200 ${showHistoryPanel ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'}`}
            title="Chat History"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={handleNewChat}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors duration-200"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* BODY CANVAS CONTAINER */}
      <div className="flex-1 relative overflow-hidden flex">

        {/* CHAT FEED WINDOW */}
        <div className="flex-1 flex flex-col h-full overflow-y-auto px-5 py-3 space-y-3">
          {visibleMessages.length === 0 && !isThinking && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">AI Assistant Ready</h3>
                <p className="text-xs text-muted-foreground max-w-70 mt-1 leading-normal">
                  Ask me details about low stock, revenue summaries, customer analytics, or order status totals.
                </p>
              </div>
            </div>
          )}

          {/* Render past message items */}
          {visibleMessages.map((msg) => (
            <MessageCard
              key={msg.id}
              message={msg}
              onRegenerate={regenerateResponse}
              onFeedback={submitFeedback}
              isLastAssistantMessage={msg.id === lastAssistantId}
            />
          ))}

          {/* Render ongoing streaming chunk */}
          {streamingText && (
            <MessageCard
              message={{
                id: 'stream',
                role: 'assistant',
                content: streamingText,
                createdAt: new Date().toISOString()
              }}
            />
          )}

          {/* Render loader/thinking indicator */}
          {isThinking && (
            <TypingAnimation status={statusMessage || 'Thinking...'} startedAt={thinkingStartedAt} />
          )}

          {/* Brief confirmation of how long the last answer took */}
          {!isThinking && !streamingText && lastResponseTimeMs != null && (
            <p className="text-[10px] text-muted-foreground font-medium pl-1 animate-in fade-in duration-500">
              Answered in {(lastResponseTimeMs / 1000).toFixed(1)}s
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* CHAT SESSION HISTORY OVERLAY DRAWER */}
        {showHistoryPanel && (
          <div className="absolute inset-y-0 left-0 w-full z-10 border-r bg-card/95 backdrop-blur-md flex flex-col shadow-lg animate-in slide-in-from-left duration-200">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-muted/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conversations</h3>
              <button
                onClick={() => setShowHistoryPanel(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Conversation Search Bar */}
            <div className="px-3 py-2 border-b flex items-center space-x-2 bg-card">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {isLoadingHistory && (
                <div className="text-xs text-center py-6 text-muted-foreground">Loading history...</div>
              )}
              {!isLoadingHistory && filteredSessions.length === 0 && (
                <div className="text-xs text-center py-6 text-muted-foreground">No conversations found.</div>
              )}
              {filteredSessions.map((sess) => {
                const isPinned = pinnedSessionIds.includes(sess.id);
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setActiveSessionId(sess.id);
                      setShowHistoryPanel(false);
                    }}
                    className={`group w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                      activeSessionId === sess.id
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden flex-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      {editingSessionId === sess.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-card px-2 py-0.5 rounded text-xs border outline-none w-full text-foreground"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs font-medium truncate flex items-center">
                          {sess.title}
                          {isPinned && <Pin className="h-2.5 w-2.5 text-primary fill-primary ml-1.5 flex-shrink-0" />}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Pin Button */}
                      <button
                        onClick={(e) => togglePinSession(sess.id, e)}
                        className="p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded"
                        title={isPinned ? 'Unpin conversation' : 'Pin conversation'}
                      >
                        {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                      </button>

                      {editingSessionId === sess.id ? (
                        <button
                          onClick={(e) => handleSaveRename(sess.id, e)}
                          className="p-1 text-success hover:bg-success/10 rounded"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleStartRename(sess.id, sess.title, e)}
                          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteSession(sess.id, e)}
                        className="p-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* QUICK SUGGESTIONS DRAWER */}
      {visibleMessages.length === 0 && (
        <div className="px-5 py-2.5 bg-card/30 border-t">
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSuggestionClick(s)}
                className="text-xs px-2.5 py-1.5 rounded-xl border bg-card hover:bg-primary/5 hover:border-primary/30 text-muted-foreground hover:text-primary transition-all font-medium duration-150"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT FORM CONTAINER */}
      <div className="p-4 border-t bg-card/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isThinking}
            placeholder={isThinking ? 'Copilot is writing...' : 'Ask about sales, revenue, low stock...'}
            className="flex-1 bg-background/80 border rounded-xl px-4 py-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 text-foreground placeholder-muted-foreground font-medium transition-all"
          />
          {isThinking ? (
            <button
              type="button"
              onClick={stopResponse}
              className="p-3 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-all cursor-pointer"
              title="Stop Response"
            >
              <SidebarClose className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                inputVal.trim()
                  ? 'bg-primary text-primary-foreground shadow-sm hover:scale-105'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          )}
        </form>
      </div>

    </div>
  );
};
export default CopilotSidebar;
