"use client";

import { useEffect, useState } from "react";
import { getMealHistory, DEMO_USER_ID, type MealLog, type NutrientData } from "@/lib/api";

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

export default function History() {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getMealHistory(DEMO_USER_ID, date)
      .then(setLogs)
      .catch(() => setError("Could not load history. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [date]);

  const totals = sumNutrients(logs);
  const proteinPct = Math.min((totals.protein_g / 120) * 100, 100);
  const carbsPct   = Math.min((totals.carbs_g   / 250) * 100, 100);
  const fatPct     = Math.min((totals.fat_g     /  70) * 100, 100);

  return (
    <>
      {/* AI summary */}
      <section className="relative overflow-hidden rounded-xl p-8 bg-surface-container-lowest shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined" style={{ fontSize: "6rem" }}>
            auto_awesome
          </span>
        </div>
        <div className="relative z-10">
          <p className="font-headline text-on-surface-variant text-xs font-bold tracking-widest uppercase mb-2">
            Day in review
          </p>
          <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface leading-tight">
            {logs.length === 0
              ? <>Nothing logged for <span className="text-primary italic">this day.</span></>
              : <>You logged <span className="text-primary italic">{logs.length}</span> {logs.length === 1 ? "meal" : "meals"}.</>}
          </h1>
          <p className="mt-4 text-on-surface-variant max-w-md leading-relaxed">
            {totals.calories > 0
              ? `Total: ${Math.round(totals.calories)} kcal · ${Math.round(totals.protein_g)}g protein · ${Math.round(totals.carbs_g)}g carbs · ${Math.round(totals.fat_g)}g fat.`
              : "Pick a different day to see your history."}
          </p>
        </div>
      </section>

      {/* Date picker */}
      <section className="flex items-center justify-between gap-3">
        <label className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
          Date
        </label>
        <input
          type="date"
          className="input-soft w-auto max-w-xs"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
        />
      </section>

      {error && (
        <div className="bg-error-container/20 border-l-4 border-error rounded-xl p-4 text-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Macro consistency bars */}
      {logs.length > 0 && (
        <section className="card-soft space-y-6">
          <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">
            Macro consistency
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Protein</span>
                <span className="text-primary">{Math.round(proteinPct)}% of target</span>
              </div>
              <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full editorial-gradient rounded-full progress-bar-glow transition-all duration-700"
                     style={{ width: `${proteinPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Carbohydrates</span>
                <span className="text-secondary-dim">{Math.round(carbsPct)}% of target</span>
              </div>
              <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full transition-all duration-700"
                     style={{ width: `${carbsPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-on-surface">Healthy fats</span>
                <span className="text-tertiary">{Math.round(fatPct)}% of target</span>
              </div>
              <div className="h-4 w-full bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed-dim rounded-full transition-all duration-700"
                     style={{ width: `${fatPct}%` }} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Meal list */}
      {loading ? (
        <p className="text-sm text-on-surface-variant">Loading…</p>
      ) : logs.length === 0 ? null : (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold tracking-tight font-headline px-1">
            Meals
          </h2>
          {logs.map((log) => {
            const n = log.nutrients;
            const time = new Date(log.created_at).toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit",
            });
            const conf = log.confidence;
            const confClass =
              conf === "high"   ? "text-primary"  :
              conf === "low"    ? "text-error"    : "text-tertiary";
            return (
              <article key={log.id} className="card-soft space-y-3">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-on-surface flex-1 pr-3">{log.meal_description}</p>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-on-surface-variant">{time}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${confClass}`}>
                      {conf}
                    </p>
                  </div>
                </div>

                {n && (
                  <div className="flex flex-wrap gap-2">
                    {[
                      { l: "kcal",    v: n.calories },
                      { l: "protein", v: n.protein_g, u: "g" },
                      { l: "carbs",   v: n.carbs_g,   u: "g" },
                      { l: "fat",     v: n.fat_g,     u: "g" },
                      { l: "sugar",   v: n.sugar_g,   u: "g" },
                      { l: "fiber",   v: n.fiber_g,   u: "g" },
                    ].map(({ l, v, u }) => (
                      <span key={l} className="bg-surface-container-low rounded-lg px-2 py-1 text-[11px]">
                        <span className="font-bold">{Math.round(v)}{u ?? ""}</span>
                        <span className="text-on-surface-variant ml-1">{l}</span>
                      </span>
                    ))}
                  </div>
                )}

                {log.imbalances.length > 0 && (
                  <p className="text-xs text-on-tertiary-container bg-tertiary-container/30 px-3 py-2 rounded-lg">
                    {log.imbalances.join(" · ")}
                  </p>
                )}

                {log.suggestions.length > 0 && (
                  <p className="text-xs text-on-secondary-container bg-secondary-container/30 px-3 py-2 rounded-lg">
                    {log.suggestions[0]}
                    {log.suggestions.length > 1 && ` (+${log.suggestions.length - 1} more)`}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
