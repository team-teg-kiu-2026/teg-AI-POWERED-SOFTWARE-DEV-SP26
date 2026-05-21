"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMealHistory, DEMO_USER_ID, type MealLog, type NutrientData } from "@/lib/api";

const ZERO_NUTRIENTS: NutrientData = {
  calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, sugar_g: 0, fiber_g: 0,
};

function sumNutrients(logs: MealLog[]): NutrientData {
  return logs.reduce((acc, log) => {
    const n = log.nutrients ?? {};
    return {
      calories:  acc.calories  + (n.calories  ?? 0),
      protein_g: acc.protein_g + (n.protein_g ?? 0),
      carbs_g:   acc.carbs_g   + (n.carbs_g   ?? 0),
      fat_g:     acc.fat_g     + (n.fat_g      ?? 0),
      sugar_g:   acc.sugar_g   + (n.sugar_g    ?? 0),
      fiber_g:   acc.fiber_g   + (n.fiber_g    ?? 0),
    };
  }, ZERO_NUTRIENTS);
}

function NutrientBar({ label, value, unit, max, color }: {
  label: string; value: number; unit: string; max: number; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{Math.round(value)}{unit}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    getMealHistory(DEMO_USER_ID, today)
      .then(setLogs)
      .catch(() => setError("Could not load today's data. Make sure the backend is running."))
      .finally(() => setLoading(false));
  }, [today]);

  const totals = sumNutrients(logs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today's Overview</h1>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {error && (
        <div className="card border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-700">Nutrients logged today</h2>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No meals logged yet.</p>
          ) : (
            <div className="space-y-3">
              <NutrientBar label="Calories"  value={totals.calories}  unit=" kcal" max={2000} color="bg-orange-400" />
              <NutrientBar label="Protein"   value={totals.protein_g} unit="g"     max={60}   color="bg-blue-400"   />
              <NutrientBar label="Carbs"     value={totals.carbs_g}   unit="g"     max={250}  color="bg-yellow-400" />
              <NutrientBar label="Fat"       value={totals.fat_g}     unit="g"     max={70}   color="bg-purple-400" />
              <NutrientBar label="Sugar"     value={totals.sugar_g}   unit="g"     max={50}   color="bg-red-400"    />
              <NutrientBar label="Fiber"     value={totals.fiber_g}   unit="g"     max={30}   color="bg-green-400"  />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: "/log",       label: "Log a Meal",       desc: "Analyze text or photo",          color: "bg-green-50  border-green-200" },
          { href: "/inventory", label: "Manage Inventory",  desc: "Update your fridge & pantry",    color: "bg-blue-50   border-blue-200"  },
          { href: "/history",   label: "View History",      desc: "Past meals and nutrient trends",  color: "bg-purple-50 border-purple-200"},
        ].map(({ href, label, desc, color }) => (
          <Link key={href} href={href} className={`card border ${color} hover:shadow-md transition-shadow`}>
            <p className="font-semibold">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      {logs.length > 0 && (
        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-700">Meals today</h2>
          {logs.map((log) => (
            <div key={log.id} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{log.meal_description}</p>
                {log.imbalances.length > 0 && (
                  <p className="text-xs text-orange-600 mt-0.5">{log.imbalances[0]}</p>
                )}
              </div>
              <span className="text-xs text-gray-400 shrink-0 ml-4">
                {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
