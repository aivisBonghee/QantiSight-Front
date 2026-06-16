"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "QantiSight AI 어시스턴트입니다. 슬라이드 QC 결과, 케이스 통계, 품질 지표에 대해 질문하세요.",
  timestamp: new Date(),
};

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  function autoResizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    autoResizeTextarea();
  }

  const composingRef = useRef(false);
  const [btnPos, setBtnPos] = useState({ x: 24, y: 24 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: btnPos.x, origY: btnPos.y, moved: false };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    const newX = Math.max(8, Math.min(window.innerWidth - 56, dragRef.current.origX + (window.innerWidth - e.clientX) - (window.innerWidth - dragRef.current.startX - dragRef.current.origX)));
    const newY = Math.max(8, Math.min(window.innerHeight - 56, dragRef.current.origY + (window.innerHeight - e.clientY) - (window.innerHeight - dragRef.current.startY - dragRef.current.origY)));
    setBtnPos({ x: newX, y: newY });
  }

  function onPointerUp() {
    if (dragRef.current && !dragRef.current.moved) {
      setIsOpen((prev) => !prev);
    }
    dragRef.current = null;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !composingRef.current) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setIsTyping(true);

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: m.content,
      }));

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류 (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("스트리밍을 사용할 수 없습니다.");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + data.content }
                    : m
                )
              );
            } else if (data.type === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: `오류: ${data.content}` }
                    : m
                )
              );
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `연결 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* Chat panel */}
      <div
        aria-hidden={!isOpen}
        className={cn(
          "fixed z-40 flex flex-col",
          // Desktop: bottom-right popup
          "bottom-20 right-4 w-[360px] max-w-[calc(100vw-2rem)]",
          "sm:bottom-20 sm:right-6",
          // Mobile: fullscreen
          "max-sm:bottom-0 max-sm:right-0 max-sm:left-0 max-sm:top-0 max-sm:w-full max-sm:max-w-none",
          // Panel base
          "rounded-2xl max-sm:rounded-none",
          "bg-white border border-[#355C94]/15 shadow-2xl shadow-[#08376A]/15",
          // Animation
          "transition-all duration-200 ease-out origin-bottom-right max-sm:origin-bottom",
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ height: "clamp(420px, 60vh, 560px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#355C94] rounded-t-2xl max-sm:rounded-none shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2a8 8 0 100 16A8 8 0 0010 2zm-1.5 5.5a.5.5 0 011 0v.5h.5a.5.5 0 010 1h-.5v.5a.5.5 0 01-1 0V9h-.5a.5.5 0 010-1h.5v-.5zM10 13a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-tight">
                QantiSight AI
              </p>
              <p className="text-white/60 text-[10px] leading-tight">
                Slide QC Assistant
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-[#355C94]/10 border border-[#355C94]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3 h-3 text-[#355C94]"
                  >
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.516 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                  </svg>
                </div>
              )}
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#355C94] text-white rounded-tr-sm"
                    : "bg-[#F5F7FA] text-[#1a2d4a] rounded-tl-sm border border-[#355C94]/8"
                )}
              >
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-sm">{children}</li>,
                      code: ({ children }) => <code className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono">{children}</code>,
                      h3: ({ children }) => <h3 className="font-bold text-sm mt-2 mb-1">{children}</h3>,
                      h4: ({ children }) => <h4 className="font-semibold text-sm mt-1.5 mb-0.5">{children}</h4>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
                <p
                  className={cn(
                    "text-[10px] mt-1 leading-none",
                    msg.role === "user"
                      ? "text-white/50 text-right"
                      : "text-[#355C94]/40"
                  )}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-[#355C94]/10 border border-[#355C94]/20 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3 h-3 text-[#355C94]"
                >
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.516 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                </svg>
              </div>
              <div className="bg-[#F5F7FA] border border-[#355C94]/8 rounded-2xl rounded-tl-sm px-3 py-2.5">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#355C94]/40 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#355C94]/40 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#355C94]/40 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Divider */}
        <div className="h-px bg-[#355C94]/10 shrink-0 mx-4" />

        {/* Input */}
        <div className="px-3 py-2.5 shrink-0">
          <div className="flex items-end gap-2 rounded-xl border border-[#355C94]/20 bg-[#F5F7FA] px-3 py-2 focus-within:border-[#355C94]/50 focus-within:bg-white transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={() => { composingRef.current = false; }}
              placeholder="메시지를 입력하세요..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-[#1a2d4a] placeholder:text-[#355C94]/35 outline-none leading-relaxed min-h-[24px] max-h-[120px] py-0"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer",
                input.trim() && !isTyping
                  ? "bg-[#355C94] text-white hover:bg-[#22487B] active:scale-95"
                  : "bg-[#355C94]/15 text-[#355C94]/40 cursor-not-allowed"
              )}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-[#355C94]/30 text-center mt-1.5">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Floating toggle button (draggable) */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label={isOpen ? "Close chat" : "Open QantiSight AI chat"}
        aria-expanded={isOpen}
        style={{ right: btnPos.x, bottom: btnPos.y }}
        className={cn(
          "fixed z-50 touch-none select-none",
          "w-12 h-12 rounded-full shadow-lg shadow-[#08376A]/30",
          "flex items-center justify-center",
          "cursor-grab active:cursor-grabbing",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#355C94] focus-visible:ring-offset-2",
          isOpen
            ? "bg-[#22487B] hover:bg-[#08376A]"
            : "bg-[#355C94] hover:bg-[#22487B]"
        )}
      >
        {/* Chat icon when closed */}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn(
            "w-5 h-5 text-white absolute transition-all duration-200",
            isOpen ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
          )}
        >
          <path
            fillRule="evenodd"
            d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.658-3.497A21.21 21.21 0 0013 14.58a21.18 21.18 0 002.57-.331c1.437-.232 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.202 41.202 0 0010 2z"
            clipRule="evenodd"
          />
        </svg>
        {/* Close icon when open */}
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={cn(
            "w-5 h-5 text-white absolute transition-all duration-200",
            isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
          )}
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </>
  );
}
