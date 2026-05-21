"use client";

import { useEffect, useState } from "react";
import {
  getInventory,
  addInventoryItem,
  deleteInventoryItem,
  DEMO_USER_ID,
  type InventoryItem,
} from "@/lib/api";

const UNITS = ["piece", "g", "kg", "ml", "L", "cup", "tbsp", "tsp"];

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("piece");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getInventory(DEMO_USER_ID)
      .then(setItems)
      .catch(() => setError("Could not load inventory. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setAdding(true);
    setError("");
    try {
      const item = await addInventoryItem(DEMO_USER_ID, {
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
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Fridge & Pantry</h1>

      <div className="card space-y-3">
        <h2 className="font-semibold text-gray-700">Add ingredient</h2>
        <div className="flex gap-2">
          <input
            className="input"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <input
            className="input w-20"
            type="number"
            min="0"
            step="0.1"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
          <select className="input w-24" value={unit} onChange={(e) => setUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary" onClick={handleAdd} disabled={adding || !name.trim()}>
          {adding ? "Adding…" : "Add"}
        </button>
      </div>

      <div className="card space-y-2">
        <h2 className="font-semibold text-gray-700">
          Inventory <span className="text-gray-400 font-normal">({items.length} items)</span>
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">No items yet. Add something from your fridge or pantry.</p>
        ) : (
          <ul className="divide-y divide-gray-50">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">{item.item_name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{item.quantity} {item.unit}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                    aria-label={`Remove ${item.item_name}`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
