"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface Message {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

function formatTime(d: string) {
  try {
    return new Date(d).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function AdminChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/project/${projectId}/chat`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, scrollToBottom]);

  const autoGrow = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, []);

  useEffect(() => {
    autoGrow();
  }, [input, autoGrow]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);

    const optimistic: Message = {
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch(`/api/project/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Błąd wysyłania");
      }
      if (data.message) {
        setMessages((prev) => [...prev, data.message as Message]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd wysyłania");
      // Roll back optimistic message? Keep it so Konrad can retry.
    } finally {
      setSending(false);
    }
  }, [input, sending, projectId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto rounded-[0.5rem] border border-[#484847]/60 bg-[#0e0e0e] p-4 space-y-4"
      >
        {loading ? (
          <div className="text-sm text-[#adaaaa]">Ładowanie historii…</div>
        ) : messages.length === 0 && !sending ? (
          <div className="text-sm text-[#adaaaa] leading-relaxed">
            Zacznij rozmowę z Claude o tym projekcie. Ma pełny kontekst -
            prompt, brief, attachments, recommendations.
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    isUser
                      ? "max-w-[80%] rounded-[0.75rem] bg-[#1a1a1a] border border-[#484847]/60 px-4 py-3 text-sm text-white whitespace-pre-wrap"
                      : "max-w-[90%] rounded-[0.75rem] bg-[#0e0e0e] border border-[#484847] px-4 py-3"
                  }
                >
                  {isUser ? (
                    <div>{m.content}</div>
                  ) : (
                    <MarkdownRenderer content={m.content} />
                  )}
                  <div
                    className={`text-[10px] mt-2 ${
                      isUser ? "text-[#adaaaa] text-right" : "text-[#adaaaa]"
                    }`}
                  >
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-[0.75rem] bg-[#0e0e0e] border border-[#484847] px-4 py-3 text-sm text-[#adaaaa] flex items-center gap-2">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#81ecff] animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#81ecff] animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#81ecff] animate-pulse [animation-delay:300ms]" />
              </span>
              Claude pisze…
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-[#ff716c]">{error}</div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Napisz wiadomość… (Enter wysyła, Shift+Enter nowa linia)"
          className="flex-1 resize-none rounded-[0.5rem] bg-[#1a1a1a] border border-[#484847] px-4 py-3 text-sm text-white placeholder:text-[#adaaaa] focus:outline-none focus:border-[#81ecff] min-h-[48px] max-h-[240px]"
          disabled={sending}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-[0.5rem] bg-[#81ecff] text-[#0e0e0e] font-bold px-5 py-3 text-sm hover:bg-[#81ecff]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-base">send</span>
          Wyślij
        </button>
      </div>
    </div>
  );
}
