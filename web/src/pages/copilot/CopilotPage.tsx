import React, { useState, useEffect, useRef } from "react";
import { useCopilotStore } from "@/features/copilot/state/copilotStore";
import { useCopilot } from "@/features/copilot/hooks/useCopilot";
import { useCopilotHistory } from "@/features/copilot/hooks/useCopilotHistory";
import { MessageCard } from "@/features/copilot/components/renderers/MessageCard";
import { TypingAnimation } from "@/features/copilot/components/renderers/TypingAnimation";
import { isVisibleMessage } from "@/features/copilot/utils/visibleMessages";
import { useElapsedTime } from "@/features/copilot/hooks/useElapsedTime";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Edit3,
  Check,
  MessageSquare,
  Sparkles,
  SidebarClose,
  Pin,
  PinOff,
  Search,
  X,
  Filter,
  ShieldCheck,
  Calendar,
  Database,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";

const SUGGESTIONS = [
  "What is today's business summary?",
  "Which products are low in stock?",
  "Who spent the most money?",
  "Show unpaid invoices",
  "Compare June and July revenue",
  "Who is absent today?"
];

// Turns a loose tool-args key like "customerId" or "from" into a readable label.
function formatFilterKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function CopilotPage() {
  const streamingText = useCopilotStore((s) => s.streamingText);
  const activeSessionId = useCopilotStore((s) => s.activeSessionId);
  const setActiveSessionId = useCopilotStore((s) => s.setActiveSessionId);
  const setOpen = useCopilotStore((s) => s.setOpen);

  const {
    messages,
    sendMessage,
    isThinking,
    statusMessage,
    stopResponse,
    submitFeedback,
    regenerateResponse,
    activeToolExecutions,
    thinkingStartedAt,
    lastResponseTimeMs,
    activeFilters,
    lastQueryEntityId
  } = useCopilot();

  const {
    sessions,
    isLoading: isLoadingHistory,
    createSession,
    renameSession,
    deleteSession
  } = useCopilotHistory();

  const headerElapsedSeconds = useElapsedTime(thinkingStartedAt);

  const [inputVal, setInputVal] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedSessionIds, setPinnedSessionIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Close the floating sidebar overlay when the fullscreen page is active
  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  // Load pinned state from localStorage on init
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wealthify_copilot_pinned");
      if (stored) {
        setPinnedSessionIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse pinned sessions:", e);
    }
  }, []);

  const togglePinSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (pinnedSessionIds.includes(id)) {
      updated = pinnedSessionIds.filter((pid) => pid !== id);
    } else {
      updated = [...pinnedSessionIds, id];
    }
    setPinnedSessionIds(updated);
    localStorage.setItem("wealthify_copilot_pinned", JSON.stringify(updated));
  };

  // Only user messages and real (non-empty) assistant answers are shown to
  // the user — internal tool-call/tool-result turns exist purely so the LLM
  // can replay its own history and are never meant to be read directly.
  const visibleMessages = messages.filter(isVisibleMessage);

  // Find the last assistant message ID to enable regeneration
  const lastAssistantId = [...visibleMessages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, isThinking, statusMessage]);

  // Select first session as active if none selected
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [activeSessionId, sessions, setActiveSessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const content = inputVal.trim();
    setInputVal("");

    const sessionId = activeSessionId ?? (await createSession("New Conversation")).id;
    sendMessage(content, sessionId);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    const sessionId = activeSessionId ?? (await createSession("New Conversation")).id;
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
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteSession(id);
    }
  };

  const handleNewChat = () => {
    createSession("New Conversation");
  };

  // Sort sessions: Pinned ones at the top, then sorted by updated timestamp
  const sortedSessions = [...sessions].sort((a, b) => {
    const aPinned = pinnedSessionIds.includes(a.id);
    const bPinned = pinnedSessionIds.includes(b.id);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filteredSessions = sortedSessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const filterEntries = activeFilters ? Object.entries(activeFilters).filter(([, v]) => v != null && v !== "") : [];

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] md:h-[calc(100vh-6.5rem)] overflow-hidden">
      <PageHeader
        title="AI Business Copilot"
        description="Interact with your business intelligence assistant in real-time."
        action={
          <Button onClick={handleNewChat} className="gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        }
      />

      <div className="flex-1 flex overflow-hidden bg-card/40 border rounded-2xl shadow-elevated backdrop-blur-md">

        {/* LEFT SIDEBAR - CONVERSATION LIST */}
        <div className="w-80 border-r flex flex-col bg-muted/30">
          <div className="p-4 border-b">
            <div className="relative flex items-center bg-card border rounded-xl px-3 py-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
              <Search className="h-4 w-4 text-muted-foreground mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs w-full text-foreground placeholder-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {isLoadingHistory && (
              <div className="flex flex-col space-y-3 p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-11 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            )}
            {!isLoadingHistory && filteredSessions.length === 0 && (
              <div className="text-xs text-center py-10 text-muted-foreground">
                No active conversations
              </div>
            )}
            {!isLoadingHistory &&
              filteredSessions.map((sess) => {
                const isPinned = pinnedSessionIds.includes(sess.id);
                const isActive = activeSessionId === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => setActiveSessionId(sess.id)}
                    className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary shadow-sm"
                        : "bg-transparent border-transparent hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden flex-1">
                      <MessageSquare
                        className={`h-4.5 w-4.5 transition-colors ${
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                      {editingSessionId === sess.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveRename(sess.id, e as any)}
                          className="bg-card px-2 py-0.5 rounded text-xs border outline-none w-full text-foreground"
                          autoFocus
                        />
                      ) : (
                        <span className="text-xs font-semibold truncate flex items-center">
                          {sess.title}
                          {isPinned && (
                            <Pin className="h-2.5 w-2.5 text-primary fill-primary ml-2 flex-shrink-0" />
                          )}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pl-2">
                      <button
                        onClick={(e) => togglePinSession(sess.id, e)}
                        className="p-1 text-muted-foreground hover:text-primary hover:bg-muted rounded"
                        title={isPinned ? "Unpin conversation" : "Pin conversation"}
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

        {/* CENTER PANEL - INTERACTIVE CHAT workspace */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background/40">
          {/* ACTIVE CHAT HEADER */}
          <div className="px-6 py-4 border-b bg-card/40 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm flex-shrink-0">
                <Bot className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-foreground truncate">
                  {activeSession ? activeSession.title : "Start a conversation"}
                </h3>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Secure business intelligence agent active
                </p>
              </div>
            </div>
            {isThinking && (
              <span className="flex items-center text-xs text-primary font-semibold gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="animate-pulse">Processing data...</span>
                <span className="text-[10px] font-mono font-medium text-muted-foreground tabular-nums">
                  {headerElapsedSeconds.toFixed(1)}s
                </span>
              </span>
            )}
          </div>

          {/* CHAT CHRONOLOGY FEED */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
            {visibleMessages.length === 0 && !isThinking && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-xl mx-auto space-y-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner relative">
                  <Sparkles className="h-8 w-8 animate-bounce" />
                  <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-secondary rounded-full animate-ping" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Welcome to Wealthify Copilot
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                    I am your enterprise-grade Business Intelligence Analyst. Send a natural language query
                    below, and I will analyze real database tables to fetch reports, calculate trends,
                    identify low stocks, or compare revenue.
                  </p>
                </div>

                <div className="w-full grid grid-cols-2 gap-3 pt-4">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(s)}
                      className="text-left text-xs p-3 rounded-xl border bg-card/60 hover:bg-primary/5 hover:border-primary/30 text-muted-foreground transition-all font-medium flex items-center justify-between group shadow-sm"
                    >
                      <span className="truncate mr-2">{s}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Past messages */}
            {visibleMessages.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                onRegenerate={regenerateResponse}
                onFeedback={submitFeedback}
                isLastAssistantMessage={msg.id === lastAssistantId}
              />
            ))}

            {/* Streaming assistant response text */}
            {streamingText && (
              <MessageCard
                message={{
                  id: "stream",
                  role: "assistant",
                  content: streamingText,
                  createdAt: new Date().toISOString()
                }}
              />
            )}

            {/* Loading typing anim */}
            {isThinking && (
              <TypingAnimation status={statusMessage || "Thinking..."} startedAt={thinkingStartedAt} />
            )}

            {/* Brief confirmation of how long the last answer took */}
            {!isThinking && !streamingText && lastResponseTimeMs != null && (
              <p className="text-[10px] text-muted-foreground font-medium pl-1 animate-in fade-in duration-500">
                Answered in {(lastResponseTimeMs / 1000).toFixed(1)}s
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ACTIVE TOOL LOGS (TINY CONSOLE) */}
          {activeToolExecutions.length > 0 && (
            <div className="mx-6 mb-2 px-4 py-2 border bg-primary/5 rounded-xl flex items-center space-x-2.5 text-xs text-primary font-mono animate-in fade-in slide-in-from-bottom-1 duration-200">
              <Database className="h-3.5 w-3.5 animate-pulse" />
              <span className="font-semibold">Registry call:</span>
              <span className="truncate">executing {activeToolExecutions.join(", ")} against backend services...</span>
            </div>
          )}

          {/* FORM PROMPT BAR */}
          <div className="p-4 border-t bg-card/40 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="flex items-center space-x-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={isThinking}
                placeholder={
                  isThinking
                    ? "Copilot is analyzing data records..."
                    : "Ask about low stock, revenue compare, order counts..."
                }
                className="flex-1 bg-card border rounded-xl px-4 py-3.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder-muted-foreground font-medium transition-all shadow-sm"
              />
              {isThinking ? (
                <button
                  type="button"
                  onClick={stopResponse}
                  className="p-3.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
                  title="Stop Response"
                >
                  <SidebarClose className="h-4.5 w-4.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputVal.trim()}
                  className={`p-3.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                    inputVal.trim()
                      ? "bg-primary text-primary-foreground hover:scale-105"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT SIDEBAR - CONTEXT & COGNITIVE STATE */}
        <div className="w-80 border-l overflow-y-auto p-5 space-y-6 hidden lg:block bg-muted/20">
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3.5">
              Cognitive Context
            </h4>

            <Card className="bg-card/80 shadow-sm">
              <CardContent className="p-4 space-y-4 text-xs">
                {/* Security Role */}
                <div className="flex items-start space-x-2.5">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Security Gate</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Read-Only Intelligence Layer</p>
                  </div>
                </div>

                {/* Calendar Relative */}
                <div className="flex items-start space-x-2.5 border-t pt-3">
                  <Calendar className="h-4 w-4 text-primary mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground">Temporal Center</p>
                    <p className="text-[10px] text-muted-foreground leading-normal font-medium mt-0.5">
                      {currentDateStr}
                    </p>
                  </div>
                </div>

                {/* Memory & Filter state — real per-session state, not a mockup */}
                <div className="flex items-start space-x-2.5 border-t pt-3">
                  <Filter className="h-4 w-4 text-primary mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Active Filters</p>
                    {filterEntries.length > 0 || lastQueryEntityId ? (
                      <div className="text-[10px] text-muted-foreground mt-1 space-y-1">
                        {filterEntries.map(([key, value]) => (
                          <p key={key} className="flex justify-between gap-2">
                            <span>{formatFilterKey(key)}:</span>
                            <span className="font-semibold text-foreground truncate max-w-36">{String(value)}</span>
                          </p>
                        ))}
                        {lastQueryEntityId && (
                          <p className="flex justify-between gap-2">
                            <span>Last referenced:</span>
                            <span className="font-semibold text-foreground truncate max-w-36">{lastQueryEntityId}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        No filters yet — ask a question to get started.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SYSTEM ARCHITECTURE CARD */}
          <div>
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3.5">
              Platform Architecture
            </h4>

            <Card className="bg-card/80 shadow-sm">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-bold text-foreground">
                  Data Pipeline Loop
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3.5 text-xs text-muted-foreground leading-relaxed font-medium">
                <div className="space-y-1 relative pl-4 border-l border-primary/20">
                  <div className="absolute top-1 left-[-4px] size-2 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-foreground">Natural Question</p>
                  <p className="text-[9px] text-muted-foreground">User posts business question via chat prompt</p>
                </div>

                <div className="space-y-1 relative pl-4 border-l border-primary/20">
                  <div className="absolute top-1 left-[-4px] size-2 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-foreground">Tool Selection</p>
                  <p className="text-[9px] text-muted-foreground">Intent detected; appropriate secure tool is chosen</p>
                </div>

                <div className="space-y-1 relative pl-4 border-l border-primary/20">
                  <div className="absolute top-1 left-[-4px] size-2 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-foreground">Services Query</p>
                  <p className="text-[9px] text-muted-foreground">Database read operations complete under RBAC gates</p>
                </div>

                <div className="space-y-1 relative pl-4">
                  <div className="absolute top-1 left-[-4px] size-2 rounded-full bg-primary" />
                  <p className="text-[10px] font-bold text-foreground">Insight Formulation</p>
                  <p className="text-[9px] text-muted-foreground">Summary synthesized and displayed in clean formatting</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
export default CopilotPage;
