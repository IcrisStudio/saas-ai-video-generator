import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles, Check, User, Copy, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { chat, parseSuggestedAction, type ChatMessage } from "../services/groqService";
import { cn } from "../lib/utils";
import { toast } from "sonner";

export interface SuggestedAction {
  suggestedAction: string;
  nodeType?: string;
  prompt?: string;
  connectToNodeId?: string;
}

interface WorkspaceChatPanelProps {
  systemPrompt: string;
  selectedNodeSummary?: string | null;
  selectedNodeId?: string | null;
  onApproveSuggestion: (action: SuggestedAction) => void;
  onApplyPromptToNode?: (nodeId: string, prompt: string) => void;
  onCreditsUsed?: (freeUsed: boolean, creditsUsed: number, freeRemaining: number) => void;
  dbUser?: { _id: string } | null;
  useChatCredits?: (args: { userId: string; responseLength: number }) => Promise<{ freeUsed: boolean; creditsUsed: number; freeRemaining: number }>;
  disabled?: boolean;
}

export function WorkspaceChatPanel({
  systemPrompt,
  selectedNodeSummary,
  selectedNodeId,
  onApproveSuggestion,
  onApplyPromptToNode,
  onCreditsUsed,
  dbUser,
  useChatCredits,
  disabled,
}: WorkspaceChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingSuggestion, setPendingSuggestion] = useState<SuggestedAction | null>(null);
  const [pendingReply, setPendingReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pendingReply]);

  const effectiveSystemPrompt = selectedNodeSummary
    ? `${systemPrompt}\n\nCurrently selected node context:\n${selectedNodeSummary}`
    : systemPrompt;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    setPendingSuggestion(null);
    setPendingReply("");

    try {
      const reply = await chat(
        [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        { systemPrompt: effectiveSystemPrompt }
      );
      if (dbUser?._id && useChatCredits) {
        try {
          const result = await useChatCredits({ userId: dbUser._id, responseLength: reply.length });
          onCreditsUsed?.(result.freeUsed, result.creditsUsed, result.freeRemaining);
        } catch (creditErr: unknown) {
          const msg = creditErr instanceof Error ? creditErr.message : "Insufficient credits for chat";
          setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg}. Use free messages or add credits.` }]);
          setLoading(false);
          return;
        }
      }
      setPendingReply(reply);
      const suggestion = parseSuggestedAction(reply);
      if (suggestion) {
        setPendingSuggestion(suggestion);
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: reply },
      ]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Failed to get AI response";
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    if (pendingSuggestion) {
      onApproveSuggestion(pendingSuggestion);
      setPendingSuggestion(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Prompt copied to clipboard"));
  };

  const lastAssistantContent = messages.length > 0 && messages[messages.length - 1].role === "assistant"
    ? messages[messages.length - 1].content
    : "";
  const looksLikePrompt = lastAssistantContent.length > 80 && !pendingSuggestion && !loading;

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all",
          "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/50",
          open && "bg-zinc-800 border-zinc-700"
        )}
        title="Workspace AI assistant"
      >
        <MessageCircle size={24} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[99] w-[400px] max-h-[520px] rounded-2xl border border-zinc-800 bg-zinc-900/98 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/50 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-emerald-400" />
                </div>
                <span className="font-semibold text-white text-sm truncate">Prompt & Workspace AI</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3 min-h-[180px] max-h-[300px]"
            >
              {messages.length === 0 && !loading && (
                <div className="text-center py-6 text-zinc-500 text-sm">
                  <p>Describe your idea — I’ll turn it into a detailed, copy-paste ready prompt.</p>
                  <p className="mt-2 text-xs">Or ask to add nodes; select a node to refine its prompt.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2 min-w-0",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0 self-start" />
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] min-w-0 rounded-2xl px-4 py-2.5 text-sm break-words whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-emerald-600/20 text-emerald-100 border border-emerald-500/30"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    )}
                  >
                    <div className="break-words">{m.content}</div>
                    {m.role === "assistant" && m.content && (
                      <button
                        type="button"
                        onClick={() => handleCopy(m.content)}
                        className="mt-2 flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-700 flex items-center justify-center flex-shrink-0 self-start">
                      <User size={12} className="text-zinc-400" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center text-zinc-500 text-sm">
                  <Loader2 size={18} className="animate-spin flex-shrink-0" />
                  <span>Thinking...</span>
                </div>
              )}
            </div>

            {pendingSuggestion && (
              <div className="px-4 py-2.5 border-t border-zinc-800 bg-zinc-950/50 flex items-center gap-2 flex-shrink-0 min-w-0">
                <div className="flex-1 min-w-0 text-xs text-zinc-400 overflow-hidden">
                  {pendingSuggestion.nodeType && (
                    <span className="text-emerald-400 font-medium">
                      Add {pendingSuggestion.nodeType} node
                    </span>
                  )}
                  {pendingSuggestion.prompt && (
                    <p className="truncate mt-0.5">{pendingSuggestion.prompt}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <Check size={14} /> Approve
                </button>
              </div>
            )}

            {looksLikePrompt && !pendingSuggestion && (
              <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/50 flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(lastAssistantContent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  <Copy size={12} /> Copy prompt
                </button>
                {selectedNodeId && onApplyPromptToNode && (
                  <button
                    type="button"
                    onClick={() => onApplyPromptToNode(selectedNodeId, lastAssistantContent)}
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
                  >
                    <PlusCircle size={12} /> Add to node
                  </button>
                )}
              </div>
            )}

            <div className="p-3 border-t border-zinc-800 flex gap-2 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Describe your idea or ask for a prompt..."
                className="flex-1 rounded-xl bg-zinc-800 border border-zinc-700 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={loading || disabled}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || loading || disabled}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
