"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getMealPlans,
  addMealPlan,
  deleteMealPlan,
  generateWeekPlan,
  weekStartOf,
  type MealPlan,
} from "@/lib/api";
import { useUserId } from "@/lib/auth";

// ── Constants ───────────────────────────────────────────────────────────────

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

const MEAL_ICON: Record<MealType, string> = {
  breakfast: "wb_sunny",
  lunch: "lunch_dining",
  dinner: "dinner_dining",
  snack: "bakery_dining",
};

const MEAL_COLOR: Record<MealType, string> = {
  breakfast: "text-amber-600",
  lunch: "text-primary",
  dinner: "text-secondary",
  snack: "text-tertiary",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Helpers ─────────────────────────────────────────────────────────────────

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d;
}

function formatShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDateKey(new Date());
}

// ── Component ───────────────────────────────────────────────────────────────

export default function Calendar() {
  const userId = useUserId();

  // Week state
  const [weekStart, setWeekStart] = useState(() => weekStartOf(new Date()));
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Inline add-meal form state: which day is open
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newMealType, setNewMealType] = useState<MealType>("lunch");
  const [newMealName, setNewMealName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Data fetching ───────────────────────────────────────────────────────

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMealPlans(userId, weekStart);
      setPlans(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load meal plans.");
    } finally {
      setLoading(false);
    }
  }, [userId, weekStart]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Navigation ──────────────────────────────────────────────────────────

  function goWeek(delta: number) {
    const d = addDays(weekStart, delta * 7);
    setWeekStart(weekStartOf(d));
  }

  // Week label: "Jun 9 - Jun 15"
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${formatShort(addDays(weekStart, 0))} – ${formatShort(weekEnd)}`;

  // ── Generate AI plan ────────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const result = await generateWeekPlan(userId, weekStart);
      setPlans(result.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI plan generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  // ── Add meal ────────────────────────────────────────────────────────────

  async function handleAddMeal(planDate: string) {
    const trimmed = newMealName.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError("");
    try {
      const newPlan = await addMealPlan(userId, {
        plan_date: planDate,
        meal_type: newMealType,
        meal_name: trimmed,
      });
      setPlans((prev) => [...prev, newPlan]);
      setNewMealName("");
      setAddingDay(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add meal.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete meal ─────────────────────────────────────────────────────────

  async function handleDelete(planId: string) {
    try {
      await deleteMealPlan(planId);
      setPlans((prev) => prev.filter((p) => p.id !== planId));
    } catch {
      setError("Failed to delete meal.");
    }
  }

  // ── Build day data ──────────────────────────────────────────────────────

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateKey = formatDateKey(d);
    const dayMeals = plans.filter((p) => p.plan_date === dateKey);
    return { date: d, dateKey, dayName: DAY_NAMES[i], meals: dayMeals };
  });

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <section className="space-y-3">
        <span className="text-primary font-bold text-xs tracking-widest uppercase block">
          Meal Planning
        </span>
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface leading-[1.05]">
          Weekly <span className="italic text-primary">calendar.</span>
        </h1>
        <p className="text-on-surface-variant max-w-md leading-relaxed">
          Plan your meals for the week ahead. Let AI fill the gaps or add your
          own.
        </p>
      </section>

      {/* Week navigation + generate button */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goWeek(-1)}
            className="btn-soft !px-3 !py-2"
            aria-label="Previous week"
          >
            <span className="material-symbols-outlined text-base">
              chevron_left
            </span>
          </button>
          <span className="font-headline font-bold text-on-surface text-sm min-w-[10rem] text-center">
            {weekLabel}
          </span>
          <button
            onClick={() => goWeek(1)}
            className="btn-soft !px-3 !py-2"
            aria-label="Next week"
          >
            <span className="material-symbols-outlined text-base">
              chevron_right
            </span>
          </button>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <span
            className={`material-symbols-outlined text-base ${generating ? "animate-spin" : ""}`}
          >
            {generating ? "progress_activity" : "auto_awesome"}
          </span>
          {generating ? "Generating…" : "Generate AI Plan"}
        </button>
      </section>

      {/* Error banner */}
      {error && (
        <div className="bg-error-container/20 border-l-4 border-error rounded-xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-error text-base mt-0.5">
            error
          </span>
          <p className="text-sm text-on-error-container font-semibold flex-1">
            {error}
          </p>
          <button
            onClick={() => setError("")}
            className="text-on-surface-variant hover:text-error"
            aria-label="Dismiss error"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <section className="space-y-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="card-soft animate-pulse space-y-3"
            >
              <div className="h-4 w-24 bg-surface-container-low rounded-lg" />
              <div className="h-3 w-40 bg-surface-container-low rounded-lg" />
              <div className="h-3 w-32 bg-surface-container-low rounded-lg" />
            </div>
          ))}
        </section>
      )}

      {/* Day cards */}
      {!loading && (
        <section className="space-y-4">
          {days.map(({ date, dateKey, dayName, meals }) => {
            const today = isToday(dateKey);
            const grouped = MEAL_TYPES.map((type) => ({
              type,
              items: meals.filter((m) => m.meal_type === type),
            })).filter((g) => g.items.length > 0);

            return (
              <article
                key={dateKey}
                className={`card-soft space-y-3 transition-all ${
                  today
                    ? "ring-2 ring-primary/40 bg-primary-container/10"
                    : ""
                }`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-headline ${
                        today
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-low text-on-surface-variant"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div>
                      <p
                        className={`font-headline font-bold text-sm ${
                          today ? "text-primary" : "text-on-surface"
                        }`}
                      >
                        {dayName}
                      </p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-label">
                        {formatShort(date)}
                        {today && (
                          <span className="ml-2 text-primary font-bold">
                            Today
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (addingDay === dateKey) {
                        setAddingDay(null);
                      } else {
                        setAddingDay(dateKey);
                        setNewMealName("");
                        setNewMealType("lunch");
                      }
                    }}
                    className="btn-soft !px-3 !py-1.5 text-xs flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {addingDay === dateKey ? "close" : "add"}
                    </span>
                    {addingDay === dateKey ? "Cancel" : "Add meal"}
                  </button>
                </div>

                {/* Inline add-meal form */}
                {addingDay === dateKey && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-1 pb-2 border-t border-outline-variant/20">
                    <select
                      className="input-soft sm:w-32 appearance-none text-sm"
                      value={newMealType}
                      onChange={(e) =>
                        setNewMealType(e.target.value as MealType)
                      }
                    >
                      {MEAL_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
                    <input
                      className="input-soft flex-1 text-sm"
                      placeholder="Meal name"
                      value={newMealName}
                      onChange={(e) => setNewMealName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddMeal(dateKey)
                      }
                      autoFocus
                    />
                    <button
                      className="btn-primary !py-2 text-sm"
                      onClick={() => handleAddMeal(dateKey)}
                      disabled={submitting || !newMealName.trim()}
                    >
                      {submitting ? "Adding…" : "Add"}
                    </button>
                  </div>
                )}

                {/* Meals grouped by type */}
                {grouped.length > 0 ? (
                  <div className="space-y-2">
                    {grouped.map(({ type, items }) => (
                      <div key={type}>
                        {/* Meal type label */}
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`material-symbols-outlined text-sm ${MEAL_COLOR[type]}`}
                          >
                            {MEAL_ICON[type]}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest font-bold font-label text-on-surface-variant">
                            {type}
                          </span>
                        </div>

                        {/* Individual meals */}
                        {items.map((meal) => (
                          <div
                            key={meal.id}
                            className="flex items-center gap-2 group pl-6 py-1"
                          >
                            <p className="flex-1 text-sm text-on-surface font-medium truncate">
                              {meal.meal_name}
                            </p>

                            {/* Calorie pill */}
                            {meal.nutrients?.calories != null && (
                              <span className="shrink-0 bg-surface-container-low rounded-full px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                                {Math.round(meal.nutrients.calories)} kcal
                              </span>
                            )}

                            {/* AI badge */}
                            {meal.is_ai && (
                              <span className="shrink-0 inline-flex items-center gap-0.5 bg-primary-container/40 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                                <span className="material-symbols-outlined text-[10px]">
                                  auto_awesome
                                </span>
                                AI
                              </span>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(meal.id)}
                              aria-label={`Remove ${meal.meal_name}`}
                              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-on-surface-variant/40 hover:bg-error-container/40 hover:text-error transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <span className="material-symbols-outlined text-sm">
                                close
                              </span>
                            </button>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty day state */
                  <p className="text-xs text-on-surface-variant/60 italic pl-1 pt-1">
                    No meals planned
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}

      {/* Disclaimer */}
      <p className="text-on-surface-variant text-xs text-center pt-2">
        Meal plans are suggestions only &mdash; not medical or dietary advice.
      </p>
    </>
  );
}
