"use client";

import { useEffect, useState } from "react";
import {
  getInventory,
  addInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
} from "@/lib/api";
import { useUserId } from "@/lib/auth";

const UNITS = ["piece", "g", "kg", "ml", "L", "cup", "tbsp", "tsp"];

const ICON_FOR: Record<string, string> = {
  chicken: "egg_alt",
  beef:    "lunch_dining",
  fish:    "set_meal",
  rice:    "rice_bowl",
  bread:   "bakery_dining",
  milk:    "local_drink",
  egg:     "egg",
  coffee:  "coffee",
  tea:     "emoji_food_beverage",
  fruit:   "nutrition",
  apple:   "nutrition",
  banana:  "nutrition",
  veg:     "grass",
};

function iconFor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_FOR)) {
    if (lower.includes(key)) return icon;
  }
  return "kitchen";
}

export default function Inventory() {
  const userId = useUserId();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("piece");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getInventory(userId)
      .then(setItems)
      .catch(() => setError("Could not load inventory. Is the backend running?"))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true);
    setError("");
    try {
      const item = await addInventoryItem(userId, {
        item_name: trimmed,
        quantity: parseFloat(qty) || 1,
        unit,
      });
      setItems((prev) => [item, ...prev]);
      setName("");
      setQty("1");
    } catch {
      setError("Failed to add item.");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteInventoryItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Failed to delete item.");
    }
  }

  return (
    <>
      {/* Header */}
      <section>
        <h1 className="text-3xl font-extrabold tracking-tighter text-on-surface font-headline">
          Your pantry
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          What&apos;s in your fridge powers our meal suggestions.
        </p>
      </section>

      {/* Add form */}
      <section className="card-soft space-y-4">
        <h2 className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
          Add ingredient
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input-soft flex-1"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <input
            className="input-soft sm:w-24"
            type="number"
            min="0"
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <select
            className="input-soft sm:w-28 appearance-none"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          >
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        {error && (
          <p className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">{error}</p>
        )}
        <button className="btn-primary w-full" onClick={handleAdd} disabled={adding || !name.trim()}>
          {adding ? "Adding…" : "Add to pantry"}
        </button>
      </section>

      {/* List */}
      <section>
        <div className="flex justify-between items-end mb-6 px-1">
          <h2 className="text-xl font-extrabold tracking-tight font-headline">Inventory</h2>
          <span className="text-xs font-medium text-primary font-label uppercase tracking-wider">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface-variant">Loading…</p>
        ) : items.length === 0 ? (
          <div className="card-soft text-center">
            <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-2">
              kitchen
            </span>
            <p className="text-sm text-on-surface-variant">
              Empty pantry. Add something from your fridge or cupboard.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl group hover:shadow-md transition-shadow"
              >
                <div className="w-14 h-14 rounded-lg bg-primary-container/40 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">
                    {iconFor(item.item_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-on-surface truncate">{item.item_name}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  aria-label={`Remove ${item.item_name}`}
                  className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
