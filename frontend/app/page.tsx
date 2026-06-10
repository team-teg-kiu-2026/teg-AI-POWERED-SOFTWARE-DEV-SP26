"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMealHistory,
  getProfile,
  type MealLog,
  type NutrientData,
  type UserProfile,
} from "@/lib/api";
import { useUserId } from "@/lib/auth";

const ZERO: NutrientData = {
  calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0,
};

function sumNutrients(logs: MealLog[]): NutrientData {
  return logs.reduce((acc, log) => {
    const n = log.nutrients ?? {};
    return {
      calories:  acc.calories  + (n.calories  ?? 0),
      protein_g: acc.protein_g + (n.protein_g ?? 0),
      carbs_g:   acc.carbs_g   + (n.carbs_g   ?? 0),
      fat_g:     acc.fat_g     + (n.fat_g     ?? 0),
      sugar_g:   acc.sugar_g   + (n.sugar_g   ?? 0),
      fiber_g:   acc.fiber_g   + (n.fiber_g   ?? 0),
    };
  }, ZERO);
}

function CalorieRing({ consumed, target }: { consumed: number; target: number }) {
  const pct = Math.min(consumed / target, 1);
  const dash = 2 * Math.PI * 68;
  const offset = dash * (1 - pct);
  return (
    <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="68" fill="transparent"
                stroke="currentColor" strokeWidth="12" className="text-surface-container-high" />
        <circle cx="80" cy="80" r="68" fill="transparent"
                stroke="currentColor" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={dash} strokeDashoffset={offset}
                className="text-primary transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-headline font-bold text-on-surface">
          {Math.round(consumed)}
        </span>
        <span className="text-[10px] font-label text-on-surface-variant font-medium uppercase tracking-widest">
          of {target} kcal
        </span>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, colorClass }: {
  label: string; value: number; target: number; colorClass: string;
}) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center justify-between text-center">
      <div className="w-2 h-12 bg-surface-container-highest rounded-full overflow-hidden relative">
        <div className={`absolute bottom-0 left-0 w-full ${colorClass} rounded-full transition-all duration-700`}
             style={{ height: `${pct}%` }} />
      </div>
      <div>
        <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase">{label}</p>
        <p className="font-bold text-sm">{Math.round(value)}g</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const userId = useUserId();
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([getMealHistory(userId, today), getProfile(userId)])
      .then(([l, p]) => {
        setLogs(l);
        setProfile(p);
      })
      .catch(() => setError("Could not load today's data. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [userId, today]);

  const totals = sumNutrients(logs);
  const calorieTarget = profile?.calorie_target ?? 2000;
  const proteinTarget = profile?.protein_target_g ?? 120;
  const carbsTarget   = profile?.carbs_target_g ?? 250;
  const fatTarget     = profile?.fat_target_g ?? 70;
  const remaining = Math.max(0, calorieTarget - totals.calories);
  const insight = logs.flatMap((l) => l.suggestions ?? [])[0]
    ?? logs.flatMap((l) => l.imbalances ?? [])[0]
    ?? null;
  const isOnTrack = totals.calories > 0 && remaining > 0;

  return (
    <>
      {/* Welcome hero */}
      <section className="bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2 text-center md:text-left">
          <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest">
            Welcome back
          </p>
          <h1 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface leading-tight">
            Your day is{" "}
            <span className="text-primary">
              {loading ? "loading…" : isOnTrack ? "on track." : logs.length === 0 ? "ready to start." : "looking good."}
            </span>
          </h1>
        </div>
        <CalorieRing consumed={totals.calories} target={calorieTarget} />
      </section>

      {error && (
        <div className="bg-error-container/20 border-l-4 border-error rounded-xl p-4 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Plan CTA */}
      <Link
        href="/plan"
        className="block bg-secondary-container/40 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined material-symbols-filled text-on-secondary">
              auto_awesome
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-bold text-on-secondary-container">
              Plan today&apos;s meals
            </p>
            <p className="text-xs text-on-secondary-container/80 mt-0.5">
              Generate suggestions using your pantry and goals
            </p>
          </div>
          <span className="material-symbols-outlined text-on-secondary-container group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </div>
      </Link>

      {/* Macro rings */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h2 className="text-xl font-headline font-bold text-on-surface">Daily Fuel</h2>
          <p className="text-sm font-medium text-primary">{Math.round(remaining)} kcal left</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MacroBar label="Protein" value={totals.protein_g} target={proteinTarget} colorClass="bg-primary" />
          <MacroBar label="Carbs"   value={totals.carbs_g}   target={carbsTarget}   colorClass="bg-secondary" />
          <MacroBar label="Fat"     value={totals.fat_g}     target={fatTarget}     colorClass="bg-tertiary" />
        </div>
      </section>

      {/* Today's meals + Balance Mode */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-surface-container-lowest rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-headline font-bold text-on-surface">Today&apos;s meals</h3>
            <span className="text-xs font-bold text-primary bg-primary-container/30 px-2 py-1 rounded-full">
              {logs.length} logged
            </span>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No meals logged yet. Tap Log to get started.</p>
          ) : (
            <ul className="space-y-3">
              {logs.slice(0, 4).map((log) => (
                <li key={log.id} className="flex justify-between items-start border-b border-surface-container last:border-0 pb-3 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold truncate">{log.meal_description}</p>
                    {log.imbalances?.length > 0 && (
                      <p className="text-xs text-tertiary mt-0.5 truncate">{log.imbalances[0]}</p>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-primary text-on-primary rounded-xl p-6 flex flex-col justify-between relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <div className="bg-on-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined material-symbols-filled">eco</span>
            </div>
            <h3 className="font-headline font-bold text-xl leading-tight mb-2">Balance Mode</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              {isOnTrack
                ? `${Math.round(remaining)} kcal left to hit your daily target.`
                : logs.length === 0
                  ? "Log your first meal to start tracking today."
                  : "You're at your daily target. Great work!"}
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary-container/30 rounded-full blur-2xl" />
        </div>
      </section>

      {/* AI insight */}
      {insight && (
        <section className="bg-secondary-container/30 rounded-xl p-6 border-l-4 border-secondary shadow-sm">
          <div className="flex gap-4">
            <div className="shrink-0">
              <span className="material-symbols-outlined text-secondary">lightbulb</span>
            </div>
            <div>
              <h4 className="font-bold text-on-secondary-container">AI Insight</h4>
              <p className="text-sm text-on-secondary-container/80 mt-1">{insight}</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
