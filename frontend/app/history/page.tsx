"use client";

import { useEffect, useState } from "react";
import { getMealHistory, DEMO_USER_ID, type MealLog } from "@/lib/api";

function NutrientPill({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <span className="inline-flex flex-col items-center bg-gray-50 rounded px-2 py-1 text-xs">
      <span className="font-semibold">{Math.round(value)}{unit}</span>
      <span className="text-gray-400">{label}</span>
    </span>
  );
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

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Meal History</h1>
        <input
          type="date"
          className="input w-auto"
          value={date}
          max={today}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {error && (
        <div className="card border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="card text-sm text-gray-400">Loading…</div>
      ) : logs.length === 0 ? (
        <div className="card text-sm text-gray-400">No meals logged for {date}.</div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const n = log.nutrients;
            const time = new Date(log.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const confidenceColor =
              log.confidence === "high" ? "text-green-600" :
              log.confidence === "low"  ? "text-red-500"   : "text-yellow-600";

            return (
              <div key={log.id} className="card space-y-3">
                <div className="flex justify-between items-start">
                  <p className="font-medium">{log.meal_description}</p>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-gray-400">{time}</p>
                    <p className={`text-xs font-medium ${confidenceColor}`}>{log.confidence}</p>
                  </div>
                </div>

                {n && (
                  <div className="flex flex-wrap gap-2">
                    <NutrientPill label="kcal"    value={n.calories}  unit=""  />
                    <NutrientPill label="protein" value={n.protein_g} unit="g" />
                    <NutrientPill label="carbs"   value={n.carbs_g}   unit="g" />
                    <NutrientPill label="fat"     value={n.fat_g}     unit="g" />
                    <NutrientPill label="sugar"   value={n.sugar_g}   unit="g" />
                    <NutrientPill label="fiber"   value={n.fiber_g}   unit="g" />
                  </div>
                )}

                {log.imbalances.length > 0 && (
                  <p className="text-xs text-orange-600">
                    ⚠ {log.imbalances.join(" · ")}
                  </p>
                )}

                {log.suggestions.length > 0 && (
                  <p className="text-xs text-green-700">
                    → {log.suggestions[0]}
                    {log.suggestions.length > 1 && ` (+${log.suggestions.length - 1} more)`}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
