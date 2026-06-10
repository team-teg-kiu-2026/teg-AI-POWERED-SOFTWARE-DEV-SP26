"use client";

import { useEffect, useRef, useState } from "react";
import { sendChat } from "@/lib/api";
import { useUserId } from "@/lib/auth";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Am I getting enough protein today?",
  "What's a healthy snack from my fridge?",
  "How do I cut sugar without feeling tired?",
];

export default function Coach() {
  const userId = useUserId();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setError("");
    setInput("");
    setLastSent(msg);
    setMessages((m) => [...m, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const reply = await sendChat(msg, userId);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function handleRetry() {
    if (!lastSent) return;
    setError("");
    setMessages((m) => m.filter((_, i) => !(i === m.length - 1 && m[i].role === "user" && m[i].content === lastSent)));
    handleSend(lastSent);
  }

  const empty = messages.length === 0;

  return (
    <>
      {/* Header */}
      <section className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl editorial-gradient flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined material-symbols-filled text-2xl">
            smart_toy
          </span>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tighter text-on-surface font-headline leading-tight">
            AI Health Coach
          </h1>
          <p className="text-on-surface-variant text-xs">
            Personalized nutrition guidance, in your pocket.
          </p>
        </div>
      </section>

      {/* Empty state */}
      {empty && (
        <section className="card-soft space-y-5">
          <div>
            <p className="text-[10px] font-bold font-label uppercase tracking-widest text-primary">
              Start a conversation
            </p>
            <h2 className="font-headline text-xl font-extrabold tracking-tight text-on-surface mt-1 leading-tight">
              Ask your nutrition coach anything.
            </h2>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed">
              From macros to mindful eating — tap a starter or type your own question below.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInput(s)}
                className="text-left text-sm bg-primary-container/30 text-on-primary-container px-4 py-3 rounded-xl font-semibold hover:bg-primary-container/50 active:scale-[0.98] transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Chat thread */}
      {!empty && (
        <section className="space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {loading && <TypingBubble />}
          <div ref={scrollRef} />
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="bg-error-container/20 rounded-xl px-4 py-3 flex items-start gap-3 border-l-4 border-error">
          <span className="material-symbols-outlined text-error text-base mt-0.5">error</span>
          <div className="flex-1">
            <p className="text-sm text-on-error-container font-semibold">{error}</p>
            {lastSent && (
              <button
                onClick={handleRetry}
                className="text-xs font-bold text-error mt-1 hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input bar */}
      <section className="sticky bottom-28 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-surface-container-lowest rounded-full p-2 shadow-lg shadow-on-surface/5 border border-outline-variant/30"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach…"
            className="flex-1 bg-transparent border-none px-4 py-2 text-sm placeholder:text-on-surface-variant/60 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md shadow-primary/30 active:scale-95 transition-all disabled:opacity-40 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined material-symbols-filled text-xl">
              send
            </span>
          </button>
        </form>
      </section>
    </>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-on-primary rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0 mb-1">
        <span className="material-symbols-outlined material-symbols-filled text-base">eco</span>
      </div>
      <div className="max-w-[80%] bg-surface-container-lowest text-on-surface rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0 mb-1">
        <span className="material-symbols-outlined material-symbols-filled text-base">eco</span>
      </div>
      <div className="bg-surface-container-lowest rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1.5 items-center h-5">
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
