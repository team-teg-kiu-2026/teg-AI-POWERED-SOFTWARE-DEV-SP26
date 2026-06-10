"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  sendChat,
  getChatHistory,
  clearChatHistory,
  generateWeekPlan,
  generateShoppingList,
  getDailyPlan,
  weekStartOf,
} from "@/lib/api";
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
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSent, setLastSent] = useState("");
  const [actionResult, setActionResult] = useState<{ type: string; message: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const history = await getChatHistory(userId);
      setMessages(
        history.map((m) => ({ role: m.role, content: m.content }))
      );
    } catch {
      // Fall back to empty state
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, actionResult]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setError("");
    setActionResult(null);
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
    setMessages((m) =>
      m.filter(
        (_, i) =>
          !(i === m.length - 1 && m[i].role === "user" && m[i].content === lastSent)
      )
    );
    handleSend(lastSent);
  }

  async function handleClear() {
    try {
      await clearChatHistory(userId);
      setMessages([]);
      setError("");
      setActionResult(null);
    } catch {
      setError("Failed to clear chat history.");
    }
  }

  async function handlePlanWeek() {
    setLoading(true);
    setError("");
    setActionResult(null);
    setMessages((m) => [...m, { role: "user", content: "Plan my meals for this week" }]);
    try {
      const ws = weekStartOf();
      const result = await generateWeekPlan(userId, ws);
      const count = result.plans.length;
      const msg = `Done! I’ve planned ${count} meals across the week and saved them to your calendar. Head to the Calendar page to see your full week.`;
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      setActionResult({ type: "calendar", message: `${count} meals added to calendar` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate week plan.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanToday() {
    setLoading(true);
    setError("");
    setActionResult(null);
    setMessages((m) => [...m, { role: "user", content: "Plan my meals for today" }]);
    try {
      const result = await getDailyPlan(userId);
      const count = result.meals.length;
      const names = result.meals.map((m) => m.name).join(", ");
      const msg = `Here’s your plan for today (${count} meals): ${names}.\n\n${result.summary}\n\nThese have been saved to your calendar automatically.`;
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      setActionResult({ type: "calendar", message: `${count} meals added to today` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate today’s plan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleShoppingList() {
    setLoading(true);
    setError("");
    setActionResult(null);
    setMessages((m) => [...m, { role: "user", content: "Generate my shopping list" }]);
    try {
      const ws = weekStartOf();
      const items = await generateShoppingList(userId, ws);
      const count = items.length;
      const topItems = items.slice(0, 5).map((i) => i.item_name).join(", ");
      const msg = count > 0
        ? `Your shopping list is ready with ${count} items! Top items: ${topItems}${count > 5 ? "..." : ""}. Check the Shopping page for the full list.`
        : "No items needed — your pantry covers this week’s plan!";
      setMessages((m) => [...m, { role: "assistant", content: msg }]);
      setActionResult({ type: "shopping", message: `${count} items on your list` });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate shopping list.");
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0 && !historyLoading;

  return (
    <>
      {/* Header */}
      <section className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl editorial-gradient flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined material-symbols-filled text-2xl">
            smart_toy
          </span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold tracking-tighter text-on-surface font-headline leading-tight">
            AI Health Coach
          </h1>
          <p className="text-on-surface-variant text-xs">
            Personalized nutrition guidance, in your pocket.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear chat history"
            title="Clear chat history"
            className="btn-soft w-9 h-9 !p-0 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        )}
      </section>

      {/* Loading skeleton */}
      {historyLoading && (
        <section className="space-y-4 animate-pulse">
          <div className="flex justify-end">
            <div className="h-10 w-48 bg-primary/10 rounded-2xl rounded-br-md" />
          </div>
          <div className="flex gap-2 items-end">
            <div className="w-8 h-8 rounded-full bg-primary-container/40 shrink-0" />
            <div className="h-16 w-64 bg-surface-container-lowest rounded-2xl rounded-bl-md" />
          </div>
        </section>
      )}

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
              From macros to mindful eating &mdash; tap a starter or type your own question below.
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

      {/* Quick actions */}
      {!historyLoading && (
        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePlanWeek}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-primary-container/30 text-on-primary-container px-3 py-2 rounded-full text-xs font-bold hover:bg-primary-container/50 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            Plan my week
          </button>
          <button
            type="button"
            onClick={handlePlanToday}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-primary-container/30 text-on-primary-container px-3 py-2 rounded-full text-xs font-bold hover:bg-primary-container/50 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">today</span>
            Plan today
          </button>
          <button
            type="button"
            onClick={handleShoppingList}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-secondary-container/30 text-on-secondary-container px-3 py-2 rounded-full text-xs font-bold hover:bg-secondary-container/50 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-sm">shopping_cart</span>
            Shopping list
          </button>
        </section>
      )}

      {/* Chat thread */}
      {!empty && !historyLoading && (
        <section className="space-y-4">
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
          {loading && <TypingBubble />}
          <div ref={scrollRef} />
        </section>
      )}

      {/* Action result banner */}
      {actionResult && (
        <Link
          href={actionResult.type === "calendar" ? "/calendar" : "/shopping"}
          className="flex items-center gap-3 bg-primary-container/30 border border-primary/15 rounded-xl px-4 py-3 hover:bg-primary-container/50 transition-colors"
        >
          <span className="material-symbols-outlined material-symbols-filled text-primary text-lg">
            {actionResult.type === "calendar" ? "event_available" : "shopping_cart"}
          </span>
          <span className="flex-1 text-sm font-semibold text-on-primary-container">
            {actionResult.message}
          </span>
          <span className="material-symbols-outlined text-on-primary-container/60 text-base">
            arrow_forward
          </span>
        </Link>
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
            placeholder="Ask your coach&hellip;"
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
